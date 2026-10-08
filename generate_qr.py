import qrcode
import os
import socket

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "10.58.38.195"

current_ip = get_local_ip()
url_localhost = "http://localhost:5173"
url_mobile = f"http://{current_ip}:5173"

print(f"[INFO] Target Mobile IP: {current_ip}")
print(f"[INFO] Target Mobile URL: {url_mobile}")

def make_qr(data, filename):
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

os.makedirs(public_dir, exist_ok=True)

path_lh = os.path.join(root_dir, "project_qr_localhost.png")
path_mob = os.path.join(root_dir, "project_qr_mobile.png")
path_pub = os.path.join(public_dir, "project_qr.png")

make_qr(url_localhost, path_lh)
make_qr(url_mobile, path_mob)
make_qr(url_mobile, path_pub)

print("All QR Code images generated successfully.")

