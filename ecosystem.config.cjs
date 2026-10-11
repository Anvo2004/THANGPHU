// PM2 cho Backend Thăng Phú trên VPS. Dùng bởi deploy/vps/thangphu-post-deploy
// (startOrReload) để biến NODE_EXTRA_CA_CERTS luôn được giữ khi restart.
// Cổng 4012 do Backend/.env quy định; 3012/3013 đã thuộc dự án khác.
module.exports = {
  apps: [
    {
      name: "thangphu-backend",
      cwd: "/var/www/thangphu/Backend",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        // Cổng thông tin xã không gửi kèm chứng chỉ trung gian (GlobalSign RSA OV SSL CA 2018).
        // Chỉ áp dụng cho tiến trình này, không tắt xác minh TLS.
        NODE_EXTRA_CA_CERTS: "/var/www/thangphu/certs/thangphu-extra-ca.pem",
      },
    },
  ],
};
