const crypto = require('crypto');
const { query } = require('../db');
const { env } = require('../src/config/env');
const paymentService = require('../services/paymentProviderService');

const frontendUrl = () => String(process.env.FRONTEND_URL || 'http://localhost:8081').replace(/\/$/, '');
const safeJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

async function initiate(req, res) {
  try {
    const bookingId = String(req.body.booking_id || '');
    const result = await query(
      `SELECT * FROM bookings WHERE booking_id=$1 AND customer_id=$2`, [bookingId, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success:false, message:'Booking not found' });
    const booking = result.rows[0];
    if (booking.payment_status === 'SUCCESS') return res.json({ success:true, already_paid:true, booking_id:bookingId });
    if (!['PAYMENT_PENDING','PAYMENT_FAILED','PENDING_PAYMENT'].includes(booking.booking_status)) {
      return res.status(409).json({ success:false, message:'This booking is not awaiting payment' });
    }
    let order;
    const existing = await query(
      `SELECT * FROM payment_attempts WHERE booking_id=$1 AND status='created'
       AND created_at>NOW()-INTERVAL '15 minutes' ORDER BY id DESC LIMIT 1`, [booking.id]
    );
    if (existing.rows.length) {
      order = { id:existing.rows[0].provider_order_id, amount:existing.rows[0].amount_paise, currency:'INR', provider:existing.rows[0].provider };
    } else {
      order = await paymentService.createOrder(booking);
      await query(
        `INSERT INTO payment_attempts(booking_id,provider,provider_order_id,amount_paise,status,metadata)
         VALUES($1,$2,$3,$4,'created',$5)`,
        [booking.id, order.provider, order.id, order.amount, JSON.stringify({customer_id:req.user.id})]
      );
      await query(
        `UPDATE bookings SET payment_provider=$1,razorpay_order_id=$2,order_id=$2,
         payment_status='PENDING',booking_status='PAYMENT_PENDING',updated_at=NOW() WHERE id=$3`,
        [order.provider,order.id,booking.id]
      );
    }
    const token = paymentService.signCheckoutToken(booking.booking_id, order.id);
    return res.json({
      success:true, booking_id:booking.booking_id, provider:order.provider, mock:order.provider==='mock',
      order_id:order.id, amount:order.amount, currency:'INR', key_id:order.provider==='razorpay'?process.env.RAZORPAY_KEY_ID:null,
      checkout_url:`${req.protocol}://${req.get('host')}/api/payments/razorpay/checkout?token=${encodeURIComponent(token)}`,
      mock_token:order.provider==='mock'?token:undefined,
    });
  } catch (error) { return res.status(400).json({ success:false, message:error.message }); }
}

async function checkout(req, res) {
  const verified = paymentService.verifyCheckoutToken(req.query.token);
  if (!verified) return res.status(401).send('Payment link is invalid or expired.');
  const result = await query('SELECT * FROM bookings WHERE booking_id=$1 AND razorpay_order_id=$2',[verified.bookingId,verified.orderId]);
  if (!result.rows.length) return res.status(404).send('Booking payment was not found.');
  const booking=result.rows[0];
  if (booking.payment_provider==='mock') return res.redirect(`${frontendUrl()}/ticket?booking_id=${encodeURIComponent(booking.booking_id)}&payment_result=pending`);
  const callback=`${req.protocol}://${req.get('host')}/api/payments/razorpay/verify-browser`;
  res.set('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; frame-src https://api.razorpay.com https://checkout.razorpay.com; connect-src 'self' https://api.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:");
  return res.type('html').send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>BookStayX Secure Payment</title><script src="https://checkout.razorpay.com/v1/checkout.js"></script><style>body{margin:0;background:#060708;color:#fff;font-family:Arial;display:grid;place-items:center;min-height:100vh}.card{width:min(88%,420px);padding:28px;border:1px solid #9d7b25;border-radius:18px;background:#101318;text-align:center}button{width:100%;padding:15px;border:0;border-radius:12px;background:#e5b52b;font-weight:700}p{color:#a8adb8}</style></head><body><div class="card"><h1>BookStayX</h1><p>Booking ${booking.booking_id}</p><p>Advance ₹${Number(booking.advance_amount).toLocaleString('en-IN')}</p><button id="pay">Pay securely</button></div><form id="done" method="post" action="${callback}"><input type="hidden" name="token" value="${String(req.query.token).replace(/"/g,'&quot;')}"><input id="pid" type="hidden" name="razorpay_payment_id"><input id="oid" type="hidden" name="razorpay_order_id"><input id="sig" type="hidden" name="razorpay_signature"></form><script>const options=${safeJson({key:process.env.RAZORPAY_KEY_ID,amount:Math.round(Number(booking.advance_amount)*100),currency:'INR',name:'BookStayX',description:`Advance for ${booking.property_name}`,order_id:booking.razorpay_order_id,prefill:{name:booking.guest_name,contact:booking.guest_phone},theme:{color:'#d8a91e'}})};options.handler=function(r){pid.value=r.razorpay_payment_id;oid.value=r.razorpay_order_id;sig.value=r.razorpay_signature;done.submit()};options.modal={ondismiss:function(){location.href=${safeJson(`${frontendUrl()}/ticket?booking_id=${booking.booking_id}&payment_result=cancelled`)}}};pay.onclick=function(){new Razorpay(options).open()};pay.click();</script></body></html>`);
}

async function verifyBrowser(req,res){
  const verified=paymentService.verifyCheckoutToken(req.body.token);
  if(!verified)return res.status(401).send('Invalid payment session');
  const {razorpay_payment_id:paymentId,razorpay_order_id:orderId,razorpay_signature:signature}=req.body;
  if(orderId!==verified.orderId||!paymentService.verifyPaymentSignature(orderId,paymentId,signature))return res.redirect(`${frontendUrl()}/ticket?booking_id=${verified.bookingId}&payment_result=failed`);
  try{await paymentService.finalizeSuccessfulPayment({bookingId:verified.bookingId,orderId,paymentId,signature,provider:'razorpay'});return res.redirect(`${frontendUrl()}/ticket?booking_id=${verified.bookingId}&payment_result=success`)}catch{return res.redirect(`${frontendUrl()}/ticket?booking_id=${verified.bookingId}&payment_result=failed`)}
}

async function mockConfirm(req,res){
  if(env.nodeEnv==='production'||env.paymentProvider!=='mock')return res.status(404).json({success:false,message:'Not found'});
  const verified=paymentService.verifyCheckoutToken(req.body.token);
  if(!verified)return res.status(401).json({success:false,message:'Mock payment token expired'});
  const owned=await query('SELECT id FROM bookings WHERE booking_id=$1 AND customer_id=$2',[verified.bookingId,req.user.id]);
  if(!owned.rows.length)return res.status(403).json({success:false,message:'Booking does not belong to this customer'});
  const paymentId=`mock_pay_${crypto.randomUUID().replace(/-/g,'')}`;
  const result=await paymentService.finalizeSuccessfulPayment({bookingId:verified.bookingId,orderId:verified.orderId,paymentId,method:'mock',provider:'mock'});
  return res.json({success:true,booking:result.booking,already_paid:result.alreadyPaid});
}

async function webhook(req,res){
  const raw=req.rawBody||Buffer.from(JSON.stringify(req.body));
  if(!paymentService.verifyWebhookSignature(raw,req.get('x-razorpay-signature')))return res.status(401).json({success:false});
  const eventId=req.get('x-razorpay-event-id')||crypto.createHash('sha256').update(raw).digest('hex');
  const recorded=await query(`INSERT INTO webhook_events(provider,event_id,event_type,payload,processed) VALUES('razorpay',$1,$2,$3,false) ON CONFLICT(provider,event_id) DO NOTHING RETURNING id`,[eventId,req.body.event,req.body]);
  if(!recorded.rows.length)return res.json({success:true,duplicate:true});
  try{
    const event=String(req.body.event||''); const payment=req.body.payload?.payment?.entity; const order=req.body.payload?.order?.entity;
    if(['payment.captured','order.paid'].includes(event)){
      const orderId=payment?.order_id||order?.id; const found=await query('SELECT booking_id FROM bookings WHERE razorpay_order_id=$1',[orderId]);
      if(found.rows.length)await paymentService.finalizeSuccessfulPayment({bookingId:found.rows[0].booking_id,orderId,paymentId:payment?.id||order?.payments?.[0]?.id,method:payment?.method||'razorpay',provider:'razorpay'});
    }else if(event==='payment.failed'){await paymentService.markPaymentFailed(payment?.order_id,payment?.id,payment?.error_description||'Payment failed')}
    else if(['refund.processed','refund.failed'].includes(event)){const refund=req.body.payload?.refund?.entity;await query(`UPDATE bookings SET refund_id=$1,refund_status=$2,updated_at=NOW() WHERE razorpay_payment_id=$3`,[refund?.id,event==='refund.processed'?'REFUND_SUCCESSFUL':'REFUND_FAILED',refund?.payment_id])}
    await query('UPDATE webhook_events SET processed=true WHERE id=$1',[recorded.rows[0].id]);
    return res.json({success:true});
  }catch(error){return res.status(500).json({success:false,message:error.message})}
}

// This endpoint is intentionally usable after the hosted checkout redirects
// back to the app. Return only the state needed by that screen; provider IDs
// and failure internals remain available through authenticated admin APIs.
async function verifyStatus(req,res){const result=await query(`SELECT booking_id,payment_status,booking_status FROM bookings WHERE booking_id=$1`,[req.params.booking_id]);if(!result.rows.length)return res.status(404).json({success:false,message:'Booking not found'});return res.json({success:true,...result.rows[0]})}

async function refund(req,res){
  let claimedBookingId = null;
  try{
    const bookingId=String(req.body.booking_id||'').trim();
    const requestedAmount=Number(req.body.amount);
    if(!bookingId)return res.status(400).json({success:false,message:'Booking ID is required'});
    if(req.body.amount!==undefined&&(!Number.isFinite(requestedAmount)||requestedAmount<=0))return res.status(400).json({success:false,message:'Refund amount must be greater than zero'});
    const claimed=await query(
      `UPDATE bookings SET refund_status='REFUND_PROCESSING',updated_at=NOW()
       WHERE booking_id=$1 AND payment_status='SUCCESS'
         AND (refund_status IS NULL OR refund_status IN ('REFUND_FAILED','REFUND_DENIED'))
       RETURNING *`,[bookingId]
    );
    if(!claimed.rows.length){
      const found=await query('SELECT payment_status,refund_status FROM bookings WHERE booking_id=$1',[bookingId]);
      if(!found.rows.length)return res.status(404).json({success:false,message:'Booking not found'});
      if(found.rows[0].payment_status!=='SUCCESS')return res.status(409).json({success:false,message:'Only successful payments can be refunded'});
      return res.status(409).json({success:false,message:'A refund already exists or is being processed for this booking'});
    }
    const booking=claimed.rows[0];claimedBookingId=booking.id;
    const amount=Math.min(req.body.amount===undefined?Number(booking.advance_amount):requestedAmount,Number(booking.advance_amount));
    const result=await paymentService.createRefund(booking,amount);
    const status=result.status==='processed'?'REFUND_SUCCESSFUL':'REFUND_INITIATED';
    await query(`UPDATE bookings SET refund_id=$1,refund_amount=$2,refund_status=$3,updated_at=NOW() WHERE id=$4`,[result.id,amount,status,booking.id]);
    return res.json({success:true,refund_id:result.id,status,amount});
  }catch(error){
    if(claimedBookingId)await query(`UPDATE bookings SET refund_status='REFUND_FAILED',updated_at=NOW() WHERE id=$1 AND refund_status='REFUND_PROCESSING'`,[claimedBookingId]).catch(()=>undefined);
    return res.status(400).json({success:false,message:error.message});
  }
}

async function refundStatus(req,res){const result=await query(`SELECT booking_id,refund_id,refund_amount,refund_status,updated_at FROM bookings WHERE booking_id=$1`,[req.params.booking_id]);if(!result.rows.length)return res.status(404).json({success:false,message:'Booking not found'});return res.json({success:true,...result.rows[0]})}

module.exports={initiate,checkout,verifyBrowser,mockConfirm,webhook,verifyStatus,refund,refundStatus};
