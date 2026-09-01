from PIL import Image, ImageFilter
import numpy as np

src = r"c:\Users\Hrushi\Downloads\bookstayx-MVP\src\assets\bookstayx-logo-src.jpg"
out = r"c:\Users\Hrushi\Downloads\bookstayx-MVP\src\assets\bookstayx-logo.png"

im = Image.open(src).convert("RGBA")
arr = np.array(im).astype(np.float32)
r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
lum = 0.299 * r + 0.587 * g + 0.114 * b
mx = np.maximum(np.maximum(r, g), b)

# Gold / warm metallic content
gold = (r > 55) & (g > 35) & ((r + g) > (b + 35)) & (lum > 40)

# Keep logo pixels; kill dark smoke/bokeh
alpha = np.zeros_like(lum)
alpha[gold] = 255
# Soft preserve bright non-gold highlights on logo edges
bright = (lum > 110) & (mx > 120)
alpha[bright] = 255

# Soften mask
mask = Image.fromarray(alpha.astype(np.uint8), mode="L")
mask = mask.filter(ImageFilter.GaussianBlur(radius=0.8))
mask_arr = np.array(mask).astype(np.float32)

# Zero out clearly dark background
dark = (lum < 38) & (~gold)
mask_arr[dark] = 0
# Fade residual brown haze
haze = (lum < 75) & (~gold) & (r < 100) & (g < 90)
mask_arr[haze] = np.minimum(mask_arr[haze], (lum[haze] - 38) / 37 * 60)
mask_arr = np.clip(mask_arr, 0, 255)

arr[:, :, 3] = mask_arr
out_im = Image.fromarray(arr.astype(np.uint8), "RGBA")

bbox = out_im.getbbox()
if bbox:
    pad = 16
    w, h = out_im.size
    out_im = out_im.crop(
        (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(w, bbox[2] + pad),
            min(h, bbox[3] + pad),
        )
    )

# Upscale for retina header
out_im = out_im.resize((out_im.width * 2, out_im.height * 2), Image.Resampling.LANCZOS)
out_im.save(out, "PNG", optimize=True)
print("saved", out, out_im.size, "alpha nonzero", int(np.count_nonzero(np.array(out_im)[:, :, 3] > 10)))
