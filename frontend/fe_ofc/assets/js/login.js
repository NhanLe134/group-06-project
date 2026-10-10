// login.js

const API_BASE = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || 'http://localhost:8000';

function quickFill(role) {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('error-msg');
    
    usernameInput.value = role;
    passwordInput.value = 'Abcd@1234';
    errorMsg.textContent = ''; // clear error
}

// Toggle password visibility
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function () {
        // Lấy type hiện tại
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Đổi icon mắt
        this.classList.toggle('ph-eye');
        this.classList.toggle('ph-eye-slash');
    });
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');
    const btnLogin = document.getElementById('btnLogin');
    
    if (!username || !password) {
        errorMsg.textContent = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu';
        return;
    }
    
    try {
        btnLogin.disabled = true;
        let dots = 0;
        btnLogin.innerHTML = 'Đang xử lý';
        window.loginInterval = setInterval(() => {
            dots = (dots + 1) % 4;
            btnLogin.innerHTML = 'Đang xử lý' + '.'.repeat(dots);
        }, 300);
        errorMsg.textContent = '';
        
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tendangnhap: username, matkhau: password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            clearInterval(window.loginInterval);
            throw new Error(data.detail || 'Đăng nhập thất bại');
        }
        
        // Save role or user info if needed
        localStorage.setItem('user_role', data.vaitro);
        localStorage.setItem('user_name', data.hoten);
        
        // Redirect based on role
        const rolePaths = {
            'KHACH': 'pages/customer.html',
            'BEP': 'pages/kitchen.html',
            'PHUC_VU': 'pages/waiter.html',
            'THU_NGAN': 'pages/cashier.html',
            'QUAN_LY': 'pages/manager.html'
        };
        
        const targetPage = rolePaths[data.vaitro];
        if (targetPage) {
            // Cố tình delay 1 chút để user thấy đang chuyển hướng
            setTimeout(() => {
                clearInterval(window.loginInterval);
                window.location.href = targetPage;
            }, 500);
        } else {
            clearInterval(window.loginInterval);
            errorMsg.textContent = 'Vai trò không hợp lệ: ' + data.vaitro;
            btnLogin.disabled = false;
            btnLogin.innerHTML = 'Đăng nhập <i class="ph-bold ph-sign-in"></i>';
        }
        
    } catch (error) {
        clearInterval(window.loginInterval);
        console.error('Login error:', error);
        errorMsg.textContent = error.message || 'Lỗi kết nối máy chủ';
        btnLogin.disabled = false;
        btnLogin.innerHTML = 'Đăng nhập <i class="ph-bold ph-sign-in"></i>';
    }
});
