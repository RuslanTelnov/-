import cv2
import numpy as np
from rembg import remove, new_session
from PIL import Image
import glob
import os

# Используем стандартную модель u2net, она часто лучше держит контур
session = new_session("u2net")

source_dir = '/home/wik/antigravity/scratch/moysklad-automation/Newest/public/catalog'
# Сначала найдем оригинальные имена (которые сейчас .png, но мы знаем их порядок в HTML)
file_order = [
    "274b1246-2108-4ad5-9760-8553573843c0.png",
    "8572d39d-753c-4ce3-81be-8f5f6f7d3546.png",
    "975fd8f1-8afe-46cb-9097-2a56ad3d59c1.png",
    "bf30360a-7fd4-4a1a-807d-87ea38eedb2f.png",
    "c7243883-614d-45b6-85cb-743508aa411f.png",
    "c8ce12d5-cbf9-40a3-80d3-4af70a80a0c2.png",
    "cb2a1842-f365-4585-b083-35c531c3db11.png",
    "f8af16df-3264-49fc-9108-d31f19f8372a.png"
]

for i, filename in enumerate(file_order):
    img_path = os.path.join(source_dir, filename)
    if not os.path.exists(img_path):
        continue
        
    print(f"Processing {filename}...")
    
    # Загружаем и восстанавливаем на белом (чтобы ИИ видел форму)
    img_pil = Image.open(img_path).convert("RGBA")
    white_bg = Image.new("RGBA", img_pil.size, (255, 255, 255, 255))
    white_bg.paste(img_pil, (0, 0), img_pil)
    input_rgb = white_bg.convert("RGB")
    
    # Удаляем фон
    output_pil = remove(input_rgb, session=session)
    rgba = np.array(output_pil)
    
    # ГИБРИДНАЯ КОРРЕКЦИЯ:
    # Переводим в HSV чтобы отделить цвет от теней
    hsv = cv2.cvtColor(np.array(input_rgb), cv2.COLOR_RGB2HSV)
    satur = hsv[:, :, 1] # Насыщенность (у теней она низкая)
    val = hsv[:, :, 2]   # Яркость (черный пульт будет здесь)
    
    # Маска насыщенности: всё что имеет цвет (Розовый, Зеленый и т.д.)
    color_mask = cv2.threshold(satur, 15, 255, cv2.THRESH_BINARY)[1]
    
    # Маска для черного пульта: он не насыщенный, но очень темный
    black_mask = cv2.threshold(val, 50, 255, cv2.THRESH_BINARY_INV)[1]
    
    # Объединенная маска "физического объекта"
    object_mask = cv2.bitwise_or(color_mask, black_mask)
    
    # Очищаем шум и тени (тени обычно имеют слабую насыщенность и среднюю яркость)
    kernel = np.ones((5,5), np.uint8)
    object_mask = cv2.morphologyEx(object_mask, cv2.MORPH_OPEN, kernel)
    object_mask = cv2.morphologyEx(object_mask, cv2.MORPH_CLOSE, kernel)
    
    # Уточняем альфа-канал от ИИ с помощью нашей маски
    # Берем ИИ как основу, но если по нашей маске там пусто - убираем (это тень)
    # Если по нашей маске там объект, а ИИ "съел" - возвращаем (это розовый бок)
    final_alpha = rgba[:, :, 3]
    
    # Заполняем внутренние дыры (чтобы не было дырок в центре пульта)
    contours, _ = cv2.findContours(final_alpha, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        c = max(contours, key=cv2.contourArea)
        cv2.drawContours(final_alpha, [c], -1, 255, -1)

    # Принудительно убираем края, которые имеют низкую насыщенность (тени)
    # Но только если это не черный пульт
    rgba[:, :, 3] = cv2.bitwise_and(final_alpha, object_mask)

    # Сохраняем под новым именем
    new_name = f"item_v2_{i+1}.png"
    final_path = os.path.join(source_dir, new_name)
    Image.fromarray(rgba).save(final_path, "PNG")
    print(f"Saved: {new_name}")
