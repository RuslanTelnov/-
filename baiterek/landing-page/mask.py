from PIL import Image
import os
import glob

files = glob.glob("public/assets/perfumes/* (1).png")
for file in files:
    img = Image.open(file).convert("RGBA")
    datas = img.getdata()
    newData = []
    for item in datas:
        # Check if the pixel is close to white (allow some tolerance for anti-aliasing)
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0)) # transparent
        else:
            newData.append(item)
    
    img.putdata(newData)
    img.save(file, "PNG")
    print("Processed", file)
