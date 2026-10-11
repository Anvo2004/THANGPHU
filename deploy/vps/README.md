# Cài đặt phía VPS cho CI/CD Thăng Phú

Làm một lần bằng root (đã thực hiện ngày 11/10/2026):

1. Chép `thangphu-deploy-gate` và `thangphu-post-deploy` vào `/usr/local/bin/`, `chmod 755`.
2. Thêm vào `/root/.ssh/authorized_keys` (một dòng, giữ nguyên tiền tố):

   `command="/usr/local/bin/thangphu-deploy-gate",restrict ssh-ed25519 <public key> thangphu-github-actions`

3. Khoá chỉ rsync được vào `/var/www/thangphu/**` và chạy `thangphu-deploy`;
   mọi lệnh khác bị từ chối. Private key nằm trong GitHub Secret `VPS_DEPLOY_SSH_KEY`.
4. `/var/www/thangphu/certs/` và `Backend/.env`, `Backend/media`, `Backend/public/images`
   nằm ngoài rsync (được loại trừ), không bị workflow ghi đè.
