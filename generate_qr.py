import qrcode
import os
import shutil

# Target URLs
url_localhost = "http://localhost:5173"
url_mobile = "http://10.139.135.195:5173"

def make_qr(data, filename, title="AI Meeting Intelligence"):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=12,
        border=3,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    img.save(filename)
    print(f"[SUCCESS] QR Code saved to {filename} for URL: {data}")

root_dir = r"c:\Users\abina\OneDrive\Desktop\MINI PROJECT"
public_dir = os.path.join(root_dir, "frontend", "public")
artifact_dir = r"C:\Users\abina\.gemini\antigravity-ide\brain\5b870001-99ed-4127-b5f8-7f980e8418d9"

os.makedirs(public_dir, exist_ok=True)
os.makedirs(artifact_dir, exist_ok=True)

path_lh = os.path.join(root_dir, "project_qr_localhost.png")
path_mob = os.path.join(root_dir, "project_qr_mobile.png")
path_pub = os.path.join(public_dir, "project_qr.png")
path_art = os.path.join(artifact_dir, "project_qr.png")

make_qr(url_localhost, path_lh)
make_qr(url_mobile, path_mob)
make_qr(url_mobile, path_pub)
make_qr(url_mobile, path_art)

print("All QR Code images generated successfully.")
