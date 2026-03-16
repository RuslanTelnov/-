import cv2
import numpy as np

# Load the image
img = cv2.imread('/home/wik/.gemini/antigravity/brain/c58eed2c-b449-48de-a9a3-dac0b01451a6/media__1773118985997.png')
if img is None:
    print("Cannot read image.")
    exit()

h, w = img.shape[:2]

# The user wants to erase the bottom text and the 4 button's text.
# The remote case is mainly blue. We can mask by coordinates.
# Let's just find the text by detecting edges or colors that are not the base blue.
# But since we don't know the exact coordinates, let's just create a generic color shift first.
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
blue_mask = cv2.inRange(hsv, np.array([100, 50, 50]), np.array([130, 255, 255]))

colors = {
    "светло_зеленый": (35, 1.2),  # Hue shift, Saturation multiplier
    "темно_зеленый": (60, 1.0),
    "черный": (0, 0.0), # Sat = 0, Val shift
    "голубой": (90, 1.2), 
    "красный": (0, 1.2) # Red hue is ~0 or ~170, but from blue (110), we shift by +60 (to 170)
}

# Actually changing colors robustly is better with simply Hue shift for all blue pixels.
for color_name, (target_hue, sat_mult) in colors.items():
    new_hsv = hsv.copy()
    
    if color_name == "черный":
        # Desaturate and darken
        new_hsv[:,:,1] = np.where(blue_mask > 0, 0, new_hsv[:,:,1])
        # Darken value
        val = new_hsv[:,:,2].astype(np.float32)
        val = np.where(blue_mask > 0, val * 0.3, val)
        new_hsv[:,:,2] = np.clip(val, 0, 255).astype(np.uint8)
    else:
        # Shift hue
        # Current blue hue is ~ 110-120 in opencv (which is 220-240 degrees)
        # We replace the hue of blue pixels with target_hue
        # We need to preserve variations, so: new_hue = target_hue + (old_hue - mean_blue_hue)
        mean_blue = np.mean(new_hsv[:,:,0][blue_mask > 0])
        hue = new_hsv[:,:,0].astype(np.float32)
        shifted = target_hue + (hue - mean_blue)
        shifted = np.mod(shifted, 180)
        new_hsv[:,:,0] = np.where(blue_mask > 0, shifted, new_hsv[:,:,0]).astype(np.uint8)
        
        # Multiply saturation
        sat = new_hsv[:,:,1].astype(np.float32)
        sat = np.where(blue_mask > 0, sat * sat_mult, sat)
        new_hsv[:,:,1] = np.clip(sat, 0, 255).astype(np.uint8)

    # Convert back
    res = cv2.cvtColor(new_hsv, cv2.COLOR_HSV2BGR)
    out_path = f'/home/wik/antigravity/scratch/moysklad-automation/Newest/чехол_реколор_код_{color_name}.png'
    cv2.imwrite(out_path, res)
    print(f"Saved {out_path}")

print("Done generating colors via script.")
