import os
import json
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FONT_PATH = "noto_devanagari.ttf"

def create_gradient_canvas(size, corner_radius=0, is_circle=False):
    """Creates a smooth diagonal gradient image with optional rounded corners or circle."""
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    # Gradient colors matching KalaSetu branding
    c1 = (200, 75, 20)      # deep terracotta
    c2 = (234, 88, 12)      # vibrant orange
    c3 = (245, 158, 11)     # warm amber

    for y in range(size):
        for x in range(size):
            t = (x + (size - y)) / (2.0 * size)
            if t < 0.5:
                u = t * 2.0
                r = int(c1[0] * (1 - u) + c2[0] * u)
                g = int(c1[1] * (1 - u) + c2[1] * u)
                b = int(c1[2] * (1 - u) + c2[2] * u)
            else:
                u = (t - 0.5) * 2.0
                r = int(c2[0] * (1 - u) + c3[0] * u)
                g = int(c2[1] * (1 - u) + c3[1] * u)
                b = int(c2[2] * (1 - u) + c3[2] * u)
            im.putpixel((x, y), (r, g, b, 255))

    if is_circle:
        mask = Image.new("L", (size, size), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse((0, 0, size - 1, size - 1), fill=255)
        im.putalpha(mask)
    elif corner_radius > 0:
        mask = Image.new("L", (size, size), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=corner_radius, fill=255)
        im.putalpha(mask)

    return im

def draw_ka(image, font_size_ratio=0.60, text_color=(255, 255, 255, 255), shadow=True, y_offset_ratio=-0.015):
    """Draws Hindi 'क' centered on the image."""
    size = image.size[0]
    font_size = int(size * font_size_ratio)
    font = ImageFont.truetype(FONT_PATH, font_size)
    try:
        font.set_variation_by_axes([850, 100])
    except Exception:
        pass

    text = "क"
    bbox = font.getbbox(text)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    pos_x = (size - text_w) // 2 - bbox[0]
    pos_y = (size - text_h) // 2 - bbox[1] + int(size * y_offset_ratio)

    if shadow and size >= 48:
        shadow_im = Image.new("RGBA", image.size, (0, 0, 0, 0))
        sdraw = ImageDraw.Draw(shadow_im)
        s_offset = max(1, int(size * 0.025))
        sdraw.text((pos_x, pos_y + s_offset), text, font=font, fill=(110, 35, 5, 110))
        blur_r = max(1, int(size * 0.015))
        shadow_im = shadow_im.filter(ImageFilter.GaussianBlur(radius=blur_r))
        image = Image.alpha_composite(image, shadow_im)

    draw = ImageDraw.Draw(image)
    draw.text((pos_x, pos_y), text, font=font, fill=text_color)
    return image

def build_all():
    print("=== Generating Master KalaSetu Icons ===")

    # 1. Master 1024x1024 App Icon (Full Square with rounded corners / squircle)
    master_icon_square = create_gradient_canvas(1024, corner_radius=220)
    master_icon_square = draw_ka(master_icon_square, font_size_ratio=0.60)

    # 2. Master 1024x1024 Full Bleed Square (for stores / PWA manifest)
    master_icon_full = create_gradient_canvas(1024, corner_radius=0)
    master_icon_full = draw_ka(master_icon_full, font_size_ratio=0.60)

    # 3. Master 1024x1024 Adaptive Icon Foreground
    # Android adaptive icon is 108dp with 72dp safe zone (~66.6% circle in center)
    adaptive_foreground = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    # Draw centered white "क" with drop shadow inside the 72dp safe zone
    # Safe zone size ~ 680px diameter
    adaptive_foreground = draw_ka(adaptive_foreground, font_size_ratio=0.48, shadow=True, y_offset_ratio=-0.01)

    # 4. Master Circle Icon
    master_icon_circle = create_gradient_canvas(1024, is_circle=True)
    master_icon_circle = draw_ka(master_icon_circle, font_size_ratio=0.58)

    # Save to mobile-app/assets
    os.makedirs("mobile-app/assets", exist_ok=True)
    # Expo icon is best as full bleed or squircle
    master_icon_square.convert("RGBA").save("mobile-app/assets/icon.png", "PNG")
    adaptive_foreground.save("mobile-app/assets/adaptive-icon.png", "PNG")

    # Mobile favicon
    fav_mobile = master_icon_square.resize((48, 48), Image.Resampling.LANCZOS)
    fav_mobile.save("mobile-app/assets/favicon.png", "PNG")

    # Mobile Splash Screen Logo
    splash_logo = master_icon_square.resize((512, 512), Image.Resampling.LANCZOS)
    splash_logo.save("mobile-app/assets/splash.png", "PNG")
    print("Saved mobile-app/assets/ icons")

    # Save Web Assets in static/
    os.makedirs("static", exist_ok=True)
    
    # 512x512
    icon_512 = master_icon_square.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save("static/android-chrome-512x512.png", "PNG")

    # 192x192 (Crucial for Chrome Shortcut Tile!)
    icon_192 = master_icon_square.resize((192, 192), Image.Resampling.LANCZOS)
    icon_192.save("static/android-chrome-192x192.png", "PNG")

    # 180x180 (Apple Touch Icon / Chrome PWA)
    icon_180 = master_icon_square.resize((180, 180), Image.Resampling.LANCZOS)
    icon_180.save("static/apple-touch-icon.png", "PNG")

    # 32x32 & 48x48
    icon_32 = master_icon_square.resize((32, 32), Image.Resampling.LANCZOS)
    icon_32.save("static/favicon.png", "PNG")

    # Multi-resolution ICO (16, 32, 48)
    icon_16 = master_icon_square.resize((16, 16), Image.Resampling.LANCZOS)
    icon_48 = master_icon_square.resize((48, 48), Image.Resampling.LANCZOS)
    master_icon_square.save("static/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    master_icon_square.save("favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print("Saved web icons in static/ and favicon.ico")

    # Web App Manifest
    manifest = {
        "name": "KalaSetu - AI Studio & Market Linkage",
        "short_name": "KalaSetu",
        "description": "AI-Driven Market Linkage & Smart Cataloging for Indian Artisans (MoSJE SIH26090)",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#0B1120",
        "theme_color": "#C85A2B",
        "icons": [
            {
                "src": "/static/android-chrome-192x192.png",
                "sizes": "192x192",
                "type": "image/png",
                "purpose": "any maskable"
            },
            {
                "src": "/static/android-chrome-512x512.png",
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "any maskable"
            },
            {
                "src": "/static/apple-touch-icon.png",
                "sizes": "180x180",
                "type": "image/png"
            }
        ]
    }
    with open("static/manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    with open("manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print("Saved manifest.json in static/ and root")

    # Native Android Mipmaps
    res_dir = "mobile-app/android/app/src/main/res"
    densities = {
        "mipmap-mdpi": {"launcher": 48, "foreground": 108, "splash": 150},
        "mipmap-hdpi": {"launcher": 72, "foreground": 162, "splash": 225},
        "mipmap-xhdpi": {"launcher": 96, "foreground": 216, "splash": 300},
        "mipmap-xxhdpi": {"launcher": 144, "foreground": 324, "splash": 450},
        "mipmap-xxxhdpi": {"launcher": 192, "foreground": 432, "splash": 600}
    }

    for folder, sizes in densities.items():
        dir_path = os.path.join(res_dir, folder)
        if os.path.exists(dir_path):
            l_sz = sizes["launcher"]
            fg_sz = sizes["foreground"]

            # ic_launcher.webp (Squircle)
            ic_sq = master_icon_square.resize((l_sz, l_sz), Image.Resampling.LANCZOS)
            ic_sq.save(os.path.join(dir_path, "ic_launcher.webp"), "WEBP")

            # ic_launcher_round.webp (Circle)
            ic_rd = master_icon_circle.resize((l_sz, l_sz), Image.Resampling.LANCZOS)
            ic_rd.save(os.path.join(dir_path, "ic_launcher_round.webp"), "WEBP")

            # ic_launcher_foreground.webp (Transparent canvas with centered 'क')
            ic_fg = adaptive_foreground.resize((fg_sz, fg_sz), Image.Resampling.LANCZOS)
            ic_fg.save(os.path.join(dir_path, "ic_launcher_foreground.webp"), "WEBP")
            print(f"Updated Android {folder}")

    # Drawable splash logos
    for folder, sizes in densities.items():
        drawable_name = folder.replace("mipmap-", "drawable-")
        drawable_path = os.path.join(res_dir, drawable_name)
        if os.path.exists(drawable_path):
            sp_sz = sizes["splash"]
            sp_img = master_icon_square.resize((sp_sz, sp_sz), Image.Resampling.LANCZOS)
            sp_img.save(os.path.join(drawable_path, "splashscreen_logo.png"), "PNG")
            print(f"Updated {drawable_name}/splashscreen_logo.png")

    print("=== All KalaSetu Icons successfully built! ===")

if __name__ == "__main__":
    build_all()
