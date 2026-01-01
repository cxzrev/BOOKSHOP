const HOME_CATEGORIES = [
    { id: 'marxism', name: '马列毛邓、思想理论' },
    { id: 'philosophy', name: '哲学宗教' },
    { id: 'social', name: '社会科学总论' },
    { id: 'politics', name: '政治、法律' },
    { id: 'economy', name: '经济' },
    { id: 'military', name: '军事' }
];

window.addEventListener('DOMContentLoaded', async () => {
    // 1. 同步登录状态 (首页和所有页面)
    await checkLoginStatus();

    // 2. 首页逻辑：加载彩色长廊
    const homeSections = document.getElementById('homeCategorySections');
    if (homeSections) {
        // 先清空，再加载，双重保险
        homeSections.innerHTML = '';
        await initHomePage();
    }

    // 3. 搜索页逻辑：自动触发搜索
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    if (q && typeof performSearch === 'function') {
        performSearch(q);
    }

    // 4. 给搜索框绑定回车事件
    const navInput = document.getElementById('navSearchInput');
    if (navInput) {
        navInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.doNavSearch();
        });
    }
});

// 注册请求
async function registerUser(username, password) {
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        if (result.code === 200) {
            alert("注册成功！即将跳转登录...");
            window.location.href = "login.html"; // [cite: 184]
        } else if (result.code === 409) { // 409 是你在文档中约定的“数据冲突/用户名已存在”
            document.getElementById('errorMsg').innerText = "该用户名已被注册，请尝试其他名称。"; // 满足唯一性报错要求 [cite: 172]
        } else if (username.trim() === "") {
            document.getElementById('errorMsg').innerText = "用户名不能为空！";
        } else {
            document.getElementById('errorMsg').innerText = result.message; // 显示如“用户名已存在” [cite: 172]
        }
    } catch (e) {
        console.error("请求失败", e);
    }
}

async function updateNavUI() {
    const userArea = document.getElementById('userArea');
    try {
        const response = await fetch('/api/me');
        const result = await response.json();

        if (result.code === 200) {
            // 已登录：显示购物车和退出
            userArea.innerHTML = `
                <a href="basket.html" class="nav-item">🛒 购物车</a>
                <a href="#" onclick="logout()" class="nav-item">退出</a>
            `;
        } else {
            // 未登录：显示登录和注册，但“欢迎”大字依然在页面上
            userArea.innerHTML = `
                <a href="login.html" class="nav-item">登录</a>
                <a href="register.html" class="nav-item">注册</a>
            `;
        }
    } catch (e) {
        // 网络错误或后端未启动时的兜底
        userArea.innerHTML = `<a href="login.html" class="nav-item">登录</a>`;
    }
}

// 登录请求
async function loginUser(username, password) {
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const result = await res.json();
    if (result.code === 200) {
        window.location.href = "index.html";
        return true;
    } else {
        alert(result.message);
        return false;
    }
}

async function initHomePage() {
    const container = document.getElementById('homeCategorySections');
    if (!container) return; // 安全检查
    container.innerHTML = ''; // 清空之前的加载提示

    const colors = { 'marxism':'#d32f2f', 'philosophy':'#fbc02d', 'social':'#616161', 'politics':'#1976d2', 'economy':'#f57c00', 'military':'#388e3c' };

    for (const cat of HOME_CATEGORIES) {
        try {
            const res = await fetch(`/api/books/category?type=${cat.id}`);
            const result = await res.json();

            if (result.code === 200 && result.data.length > 0) {
                const section = document.createElement('div');
                section.className = 'cat-row';
                // 强制去掉下划线的内联样式
                section.innerHTML = `
                    <div class="cat-header">
                        <span>${cat.name}</span>
                        <a href="category.html?type=${cat.id}">探索更多 ></a>
                    </div>
                    <div class="book-scroller">
                        ${result.data.slice(0, 5).map(book => `
                            <div class="mini-book-card">
                                <a href="book-info.html?id=${book.bookId || book.book_id}" style="text-decoration:none !important; color:inherit; border:none;">
                                    <div style="height:150px; background:${colors[cat.id] || '#999'}; display:flex; align-items:center; justify-content:center; color:#fff; font-size:40px; font-weight:bold; border-radius:8px;">
                                        ${book.title[0]}
                                    </div>
                                    <div style="padding:10px; text-align:center;">
                                        <h4 style="margin:0; color:#333; text-decoration:none !important;">${book.title}</h4>
                                    </div>
                                </a>
                            </div>
                        `).join('')}
                    </div>`;
                container.appendChild(section);
            }
        } catch (e) {
            console.error(`加载分类 ${cat.id} 失败:`, e);
        }
    }
}

async function syncUserStatus() {
    const userArea = document.getElementById('userArea');
    if (!userArea) return false;

    try {
        const res = await fetch('/api/me');
        const result = await res.json();

        if (result.code === 200 && result.data.loggedIn) {
            userArea.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <a href="orders.html" style="text-decoration: none; display: flex; align-items: center;">
                        <div title="查看我的订单" style="width: 32px; height: 32px; border-radius: 50%; background: #fff; color: #333; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 1px solid #ddd; cursor: pointer;">
                            ${result.data.username[0]}
                        </div>
                    </a>
                    <span style="color: white;">${result.data.username}</span>
                    <a href="basket.html" style="color: white; text-decoration: none;">🛒 购物车</a>
                    <a href="javascript:void(0)" onclick="logoutUser()" style="color: #ffcccc; text-decoration: none;">退出</a>
                </div>`;
            return true;
        } else {
            userArea.innerHTML = `
                <a href="login.html" class="nav-item">登录</a>
                <a href="register.html" class="nav-item">注册</a>`;
            return false;
        }
    } catch (e) {
        return false;
    }
}
// 统一的退出逻辑
window.handleLogout = async function() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = "index.html"; // 强制回首页清空状态
};

function renderHomeBookCard(book, catId) {
    const bid = book.bookId || book.book_id;
    const colors = {
        'ML': '#d32f2f', 'ZX': '#fbc02d', 'SH': '#616161',
        'ZZ': '#1976d2', 'JJ': '#f57c00', 'JS': '#388e3c', 'default': '#999'
    };
    // 使用 getCatId 获取颜色 Key
    const colorKey = getCatId(book.category) || 'default';
    const bgColor = colors[colorKey];

    return `
        <div class="mini-book-card" style="box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; background: #fff; min-width: 140px;">
            <a href="book-info.html?id=${bid}" style="text-decoration: none !important;">
                <div class="mini-cover" style="height: 150px; background-color: ${bgColor}; display: flex; align-items: center; justify-content: center; color: white; font-size: 40px; font-weight: bold;">
                    ${book.title[0]}
                </div>
                <div class="mini-info" style="padding: 10px; text-align: center;">
                    <h4 style="margin: 0; font-size: 14px; color: #333; text-decoration: none !important;">${book.title}</h4>
                </div>
            </a>
        </div>`;
}

function getCatId(name) {
    if (!name) return 'default';
    if (name.includes('马列')) return 'marxism';
    if (name.includes('哲学')) return 'philosophy';
    if (name.includes('社会')) return 'social';
    if (name.includes('政治')) return 'politics';
    if (name.includes('经济')) return 'economy';
    if (name.includes('军事')) return 'military';
    return 'default';
}
// 挂载到 window 确保其他页面能用
window.getCatId = getCatId;

// 执行搜索功能
async function executeSearch() {
    const query = document.getElementById('searchInput').value;
    const bookListDiv = document.getElementById('bookList');
    const infoDiv = document.getElementById('resultsInfo');

    if (!query) {
        alert("请输入搜索关键词");
        return;
    }

    try {
        // 调用队友给的接口：GET /api/search?q=关键词
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const result = await response.json();

        bookListDiv.innerHTML = ""; // 清空上次的结果

        if (result.code === 200 && result.data.length > 0) {
            infoDiv.innerText = `找到 ${result.data.length} 本相关图书：`;

            // 循环遍历结果列表
            result.data.forEach(book => {
                const bookCard = `
                    <div class="book-card">
                        <h3>${book.title}</h3>
                        <p>作者: ${book.author}</p>
                        <p>价格: <span class="price">￥${book.price.toFixed(2)}</span></p>
                        <p>状态: ${book.stock > 0 ? '✅ 有货' : '<span style="color:red">❌ 缺货</span>'}</p>
                        <a href="book-info.html?id=${book.book_id}" class="detail-btn">查看详情</a>
                    </div>
                `;
                bookListDiv.innerHTML += bookCard;
            });
        } else {
            infoDiv.innerText = "未找到相关图书。";
        }
    } catch (e) {
        console.error("搜索请求失败", e);
        infoDiv.innerText = "服务器连接失败，请稍后再试。";
    }
}

async function performSearch(q) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = "<p style='text-align:center;'>正在搜索...</p>";

    try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const result = await res.json();

        if (result.code === 200) {
            if (result.data.length === 0) {
                resultsContainer.innerHTML = "<p style='text-align:center;'>未找到相关书籍。</p>";
                return;
            }

            resultsContainer.innerHTML = `
                <div class="book-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 25px; padding: 20px;">
                    ${result.data.map(book => renderSearchBookCard(book)).join('')}
                </div>`;
        }
    } catch (e) {
        resultsContainer.innerHTML = "<p>搜索失败，请稍后再试。</p>";
    }
}

function renderSearchBookCard(book) {
    const bid = book.bookId || book.book_id;
    const catId = getCatId(book.category); // 获取分类 ID
    const colors = { 'marxism':'#d32f2f', 'philosophy':'#fbc02d', 'social':'#616161', 'politics':'#1976d2', 'economy':'#f57c00', 'military':'#388e3c', 'default':'#999' };

    return `
        <div class="search-book-card" style="background:#fff; border-radius:10px; box-shadow:0 4px 8px rgba(0,0,0,0.1); overflow:hidden; transition:0.3s;">
            <a href="book-info.html?id=${bid}" style="text-decoration:none; color:inherit;">
                <div style="height:200px; background:${colors[catId] || '#999'}; display:flex; align-items:center; justify-content:center; color:#fff; font-size:60px; font-weight:bold;">
                    ${book.title[0]}
                </div>
                <div style="padding:15px;">
                    <h4 style="margin:0 0 8px 0; font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${book.title}</h4>
                    <p style="margin:0; font-size:12px; color:#666;">${book.author}</p>
                    <p style="margin:10px 0 0 0; color:#e4393c; font-weight:bold; font-size:18px;">￥${book.price.toFixed(2)}</p>
                </div>
            </a>
        </div>`;
}

async function checkLoginStatus() {
    const userArea = document.getElementById('userArea');
    if (!userArea) return false; // 找不到容器也返回 false

    try {
        const res = await fetch('/api/me');
        const result = await res.json();

        if (result.code === 200 && result.data.loggedIn) {
            // 渲染已登录 UI
            userArea.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: #fff; color: #333; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 1px solid #ddd;">
                        ${result.data.username[0]}
                    </div>
                    <span style="color: white;">${result.data.username}</span>
                    <a href="basket.html" style="color: white; text-decoration: none;">🛒 购物车</a>
                    <a href="javascript:void(0)" onclick="logoutUser()" style="color: #ffcccc; text-decoration: none;">退出</a>
                </div>`;
            return true;
        } else {
            userArea.innerHTML = `
                <a href="login.html" class="nav-item">登录</a>
                <a href="register.html" class="nav-item">注册</a>`;
            return false;
        }
    } catch (e) {
        console.error("状态同步失败:", e);
        return false;
    }
}

// main.js

window.logoutUser = async function() {
    if (!confirm("确定要退出登录吗？")) return;

    try {
        // 1. 请求后端退出接口
        const res = await fetch('/api/logout', { method: 'POST' });
        const result = await res.json();

        if (res.ok || result.code === 200) {
            // 2. 清理本地购物篮（按需，通常退出后清空比较安全）
            localStorage.removeItem('book_basket');

            alert("已安全退出");

            // 3. 强制跳转回首页，刷新状态
            window.location.href = "index.html";
        } else {
            alert("退出失败：" + (result.message || "未知错误"));
        }
    } catch (e) {
        console.error("退出异常:", e);
        // 即使后端请求失败，前端也强制刷新一次
        window.location.reload();
    }
};

window.doNavSearch = function() {
    const navInput = document.getElementById('navSearchInput');
    if (!navInput) return;

    const query = navInput.value.trim();
    if (query) {
        // 跳转到 search.html 并带上查询参数 q
        console.log("正在跳转搜索:", query);
        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    }
};

// 获取购物车数据
function getCart() {
    const cart = localStorage.getItem('bookshop_cart');
    return cart ? JSON.parse(cart) : [];
}

// 保存购物车数据
function saveCart(cart) {
    localStorage.setItem('bookshop_cart', JSON.stringify(cart));
}

// main.js

window.addToCart = async function(bookId, quantity = 1) {
    // 1. 登录校验
    const res = await fetch('/api/me');
    const auth = await res.json();
    if (auth.code !== 200 || !auth.data.loggedIn) {
        alert("请先登录再加入购物车");
        window.location.href = "login.html";
        return;
    }

    try {
        // 2. 获取书籍详细信息用于展示（单价、书名等）
        const bookRes = await fetch(`/api/book/${bookId}`);
        const result = await bookRes.json();
        if (result.code !== 200) return;
        const book = result.data;

        // 3. 读取本地购物篮
        let basket = JSON.parse(localStorage.getItem('book_basket') || '[]');

        // 检查是否已有该书
        const itemIndex = basket.findIndex(item => item.bookId == bookId);
        if (itemIndex > -1) {
            basket[itemIndex].quantity += parseInt(quantity);
        } else {
            basket.push({
                bookId: book.bookId || book.book_id,
                title: book.title,
                price: book.price,
                quantity: parseInt(quantity)
            });
        }

        // 4. 保存回本地
        localStorage.setItem('book_basket', JSON.stringify(basket));
        alert("已成功加入购物篮！");
    } catch (e) {
        console.error("加入购物篮失败", e);
    }
};

// 2. 获取详情并渲染
async function loadBookDetail(bookId) {
    const detailDiv = document.getElementById('bookDetail');
    try {
        const response = await fetch(`/api/book/${bookId}`);
        const result = await response.json();

        if (result.code === 200) {
            const book = result.data;
            const isOutOfStock = book.stock <= 0;

            // 使用专门的 ID 绑定，而不是拼接字符串，防止 UI 渲染错误
            detailDiv.innerHTML = `
                    <button onclick="window.history.back()" class="back-btn">← 返回上一页</button>
                    <div class="detail-layout">
                        <div class="detail-cover-placeholder" style="background-color:#eee; width:200px; height:280px; display:flex; align-items:center; justify-content:center; font-size:80px; font-weight:bold; color:#666; margin-bottom:20px; border-radius:8px;">
                            ${book.title[0]}
                        </div>
                        <h1>${book.title}</h1>
                        <p>作者：${book.author} | ISBN：${book.isbn || 'N/A'}</p>
                        <p class="price" style="font-size:24px; color:#e53935; font-weight:bold;">价格：￥${book.price.toFixed(2)}</p>
                        <p>库存状态：<span style="color: ${isOutOfStock ? '#f44336' : '#4caf50'}; font-weight:bold;">
                            ${isOutOfStock ? '缺货' : '现货 (' + book.stock + ')'}
                        </span></p>
                        <div class="desc-box" style="margin: 20px 0; line-height: 1.6; color: #666;">
                            <strong>图书简介：</strong><br>${book.description || '暂无详细描述。'}
                        </div>
                        
                        <div class="action-area" style="display: flex; gap: 10px; align-items: center;">
                            <input type="number" id="buyQty" value="1" min="1" max="${book.stock}" 
                                   style="width: 60px; padding: 8px; border: 1px solid #ddd;" ${isOutOfStock ? 'disabled' : ''}>
                            <button id="addCartBtn" 
                                    class="${isOutOfStock ? 'btn-disabled' : 'primary-btn'}"
                                    ${isOutOfStock ? 'disabled' : ''}>
                                ${isOutOfStock ? '暂时缺货' : '加入购物车'}
                            </button>
                        </div>
                    </div>
                `;

            // 绑定加入购物车事件（避免使用内联 onclick）
            if (!isOutOfStock) {
                document.getElementById('addCartBtn').addEventListener('click', () => {
                    const qty = parseInt(document.getElementById('buyQty').value);
                    addToCart(book, qty); // 调用 main.js 中的方法
                });
            }
        } else {
            detailDiv.innerHTML = `<p>未找到该图书 (${result.message})</p>`;
        }
    } catch (e) {
        console.error("加载详情失败", e);
        detailDiv.innerHTML = "<p>系统繁忙，请稍后再试。</p>";
    }
}

async function handleAddToCart(bookId) {
    // 1. 尝试获取页面上的数量输入框（如果你详情页有输入框的话）
    const qtyInput = document.getElementById('buyQty');
    const quantity = qtyInput ? parseInt(qtyInput.value) : 1;

    // 2. 调用 main.js 中的 addToCart 函数
    // 确保 main.js 中已定义 window.addToCart = addToCart;
    const success = await addToCart(bookId, quantity);

    if (success) {
        alert("成功加入购物车！");
    }
}

// 加入购物车处理 (存储在本地 localStorage)
async function addToCartHandler(book) {
    // 先检查登录状态 [cite: 195, 202]
    const response = await fetch('/api/me');
    const result = await response.json();

    if (result.code !== 200) {
        alert("请先登录！只有登录用户才能将商品加入购物车。"); // 满足老师的强制要求 [cite: 202]
        window.location.href = "login.html";
        return;
    }

    const qty = parseInt(document.getElementById('buyQty').value);

    // 校验数量
    if (isNaN(qty) || qty <= 0) {
        alert("请输入有效的数量");
        return;
    }
    if (qty > book.stock) {
        alert("抱歉，库存不足！");
        return;
    }

    // 获取现有购物车数据
    let cart = JSON.parse(localStorage.getItem('cart') || '{}');

    // 更新数量 (book_id 作为键)
    cart[book.book_id] = (cart[book.book_id] || 0) + qty;

    // 保存回本地存储
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`成功将 ${qty} 本《${book.title}》加入购物车！`);
}


// 渲染购物车页面
async function renderBasket() {
    const basketContent = document.getElementById('basketContent');
    const basketSummary = document.getElementById('basketSummary');
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    const bookIds = Object.keys(cart);

    if (bookIds.length === 0) {
        basketContent.innerHTML = "<p>您的购物车是空的，去逛逛吧！</p>";
        if (basketSummary) basketSummary.style.display = "none";
        return;
    }

    let html = `
        <table class="basket-table">
            <thead>
                <tr>
                    <th>书名</th>
                    <th>单价</th>
                    <th>数量</th>
                    <th>小计</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
    `;

    let total = 0;

    // 遍历购物车里的每一个 ID，获取详细信息
    for (let id of bookIds) {
        try {
            // 使用之前定义的获取详情接口 (这里假设接口能按ID返回)
            const response = await fetch(`/api/book/${id}`);
            const result = await response.json();

            if (result.code === 200) {
                const book = result.data;
                const qty = cart[id];
                const subtotal = book.price * qty;
                total += subtotal;

                html += `
                    <tr>
                        <td>${book.title}</td>
                        <td>￥${book.price.toFixed(2)}</td>
                        <td>
                            <input type="number" value="${qty}" min="1" max="${book.stock}" 
                                   onchange="updateQty('${id}', this.value)">
                        </td>
                        <td class="price">￥${subtotal.toFixed(2)}</td>
                        <td><button onclick="removeFromBasket('${id}')">删除</button></td>
                    </tr>
                `;
            }
        } catch (e) { console.error("加载图书项失败", e); }
    }

    html += `</tbody></table>`;
    basketContent.innerHTML = html;
    document.getElementById('totalPrice').innerText = `￥${total.toFixed(2)}`;
    basketSummary.style.display = "block";
}

// 更新数量
function updateQty(bookId, newQty) {
    let cart = JSON.parse(localStorage.getItem('cart') || '{}');
    cart[bookId] = parseInt(newQty);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderBasket(); // 重新刷新页面数据
}

// 删除单项 [cite: 188]
function removeFromBasket(bookId) {
    let cart = JSON.parse(localStorage.getItem('cart') || '{}');
    delete cart[bookId];
    localStorage.setItem('cart', JSON.stringify(cart));
    renderBasket();
}

// 清空购物车 [cite: 192]
function clearBasket() {
    localStorage.removeItem('cart');
    renderBasket();
}

// 跳转结算
function goToCheckout() {
    window.location.href = "checkout.html";
}



async function submitOrder() {
    const address = document.getElementById('address').value;
    const creditCard = document.getElementById('creditCard').value;
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');

    if (!address || !creditCard) {
        alert("请完整填写收货地址和支付信息！");
        return;
    }

    try {
        // 调用接口：POST /api/checkout
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cart: cart, // 格式如 { "1": 2, "3": 1 }
                address: address,
                credit_card: creditCard
            })
        });

        const result = await response.json();

        if (result.code === 200) {
            alert("订单提交成功！库存已更新。"); //[cite: 208]
            localStorage.removeItem('cart'); // 成功后清空购物车 [cite: 191]
            window.location.href = "index.html";
        } else {
            // 处理库存不足等错误
            alert("下单失败：" + result.message);
        }
    } catch (e) {
        alert("网络错误，提交订单失败。");
    }
}


// 切换类别并请求数据
async function switchCategory(categoryType) {
    const titleMap = {
        'all': '全部图书',
        'philosophy': '哲学宗教',
        'social': '社会科学总论',
        'politics': '政治、法律',
        'military': '军事',
        'economy': '经济',
        'marxism': '马列毛邓'
    };

    // 1. 更新标题
    document.getElementById('categoryTitle').innerText = titleMap[categoryType] || '图书列表';

    // 2. 高亮当前选中的分类
    const items = document.querySelectorAll('#categoryList li');
    items.forEach(item => item.classList.remove('active'));
    // 假设分类顺序固定，或者你可以根据文本匹配

    // 3. 向后端请求该分类下的书籍
    const bookListDiv = document.getElementById('categoryBookList');
    bookListDiv.innerHTML = "<p>正在加载该类书籍...</p>";

    try {
        // 注意：你需要让队友在后端增加这个按类别搜索的接口
        const response = await fetch(`/api/books/category?type=${categoryType}`);
        const result = await response.json();

        if (result.code === 200) {
            bookListDiv.innerHTML = "";
            if (result.data.length === 0) {
                bookListDiv.innerHTML = "<p>该分类下暂无图书。</p>";
                return;
            }
            // 4. 复用搜索结果的渲染逻辑
            result.data.forEach(book => {
                bookListDiv.innerHTML += renderBookCard(book); // 建议将卡片渲染封装成函数
            });
        }
    } catch (e) {
        bookListDiv.innerHTML = "<p>分类数据获取失败，请检查网络。</p>";
    }
}

function renderBookCard(book) {
    const firstChar = book.title.charAt(0);
    // 判断是否缺货
    const isOutOfStock = book.stock <= 0;

    return `
        <div class="book-card ${isOutOfStock ? 'gray-scale' : ''}">
            <div class="book-cover-placeholder"><span>${firstChar}</span></div>
            <div class="book-info-brief">
                <h3>${book.title}</h3>
                <p>作者: ${book.author}</p>
                <div class="price-row">
                    <span class="price">￥${book.price.toFixed(2)}</span>
                    <span class="stock-tag">${isOutOfStock ? '<b style="color:red">缺货</b>' : '有货'}</span>
                </div>
                <a href="book-info.html?id=${book.book_id}" class="view-detail-link">查看详情</a>
            </div>
        </div>
    `;
}

// 退出登录函数
async function logout() {
    try {
        // 调用后端退出接口（让服务器销毁 Cookie/Session）
        const response = await fetch('/api/logout', { method: 'POST' });

        // 无论后端是否成功，前端都清空本地状态并刷新
        alert("您已成功退出登录");
        window.location.href = "index.html";
    } catch (e) {
        console.error("退出失败", e);
        window.location.reload();
    }
}