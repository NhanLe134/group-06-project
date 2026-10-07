/* Chứa các hàm tiện ích chung (format tiền, thời gian, gọi API mock) */
const fmtVND = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
