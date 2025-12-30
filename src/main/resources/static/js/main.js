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
    const response = await fetch('/api/me'); // 检查登录状态
    const result = await response.json();

    if (result.code === 200) {
        // 登录成功后显示：用户名 | 购物车
        userArea.innerHTML = `
            <span class="username">欢迎，${result.data.username}</span>
            <a href="basket.html" class="cart-link">🛒 购物车</a>
            <a href="#" onclick="logout()">退出</a>
        `;
    }
}

// 搜索栏跳转逻辑
function navSearch() {
    const q = document.getElementById('navSearchInput').value;
    if (q) window.location.href = `search.html?q=${encodeURIComponent(q)}`;
}

// 登录请求
async function loginUser(username, password) {
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const result = await response.json();
    if (result.code === 200) {
        // 登录成功，跳转到搜索页 [cite: 197]
        window.location.href = "search.html";
    } else {
        alert("登录失败：" + result.message); // [cite: 197]
    }
}

// 1. 定义首页要展示的分类列表（对应你要求的分类）
const HOME_CATEGORIES = [
    { id: 'marxism', name: '马列毛邓' },
    { id: 'philosophy', name: '哲学宗教' },
    { id: 'social', name: '社会科学总论' },
    { id: 'politics', name: '政治、法律' },
    { id: 'economy', name: '经济' },
    { id: 'military', name: '军事' }
];

// 2. 首页初始化函数
async function initHomePage() {
    const container = document.getElementById('homeCategorySections');
    if (!container) return;

    for (const cat of HOME_CATEGORIES) {
        try {
            // 向后端请求该分类下的书籍
            const response = await fetch(`/api/books/category?type=${cat.id}`);
            const result = await response.json();

            if (result.code === 200 && result.data.length > 0) {
                // 创建一个分类行
                const sectionHtml = `
                    <div class="cat-row">
                        <div class="cat-header">
                            <span class="cat-name">${cat.name}</span>
                            <a href="category.html?type=${cat.id}" class="more-link">探索更多 ></a>
                        </div>
                        <div class="book-scroller">
                            ${result.data.slice(0, 5).map(book => renderHomeBookCard(book)).join('')}
                        </div>
                    </div>
                `;
                container.innerHTML += sectionHtml;
            }
        } catch (e) {
            console.error(`加载分类 ${cat.name} 失败`, e);
        }
    }
}

// 3. 专为首页长廊设计的简化版卡片渲染（点击封面进详情页）
function renderHomeBookCard(book) {
    const firstChar = book.title.charAt(0);
    const isOutOfStock = book.stock <= 0; // [cite: 207]

    return `
        <div class="mini-book-card ${isOutOfStock ? 'out-of-stock' : ''}">
            <a href="book-info.html?id=${book.book_id}">
                <div class="mini-cover">${firstChar}</div>
                <div class="mini-info">
                    <h4 title="${book.title}">${book.title}</h4>
                    <p class="mini-price">￥${book.price.toFixed(2)}</p>
                    ${isOutOfStock ? '<span class="stock-tip">缺货</span>' : ''}
                </div>
            </a>
        </div>
    `;
}

// 在页面加载时启动
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    window.onload = initHomePage;
}

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

// 简单的登录状态检查（用于导航栏显示）
async function checkLoginStatus() {
    const authSpan = document.getElementById('nav-auth');
    try {
        const response = await fetch('/api/me');
        const result = await response.json();
        if (result.code === 200) {
            authSpan.innerHTML = `欢迎，${result.data.username} | <a href="#" onclick="logout()">退出</a>`;
        } else {
            authSpan.innerHTML = `<a href="login.html">登录</a> | <a href="register.html">注册</a>`;
        }
    } catch (e) {
        authSpan.innerHTML = `<a href="login.html">登录</a>`;
    }
}

// 获取图书详情并渲染
async function loadBookDetail(bookId) {
    const detailDiv = document.getElementById('bookDetail');
    const response = await fetch(`/api/book/${bookId}`);
    const result = await response.json();

    if (result.code === 200) {
        const book = result.data;
        const isOutOfStock = book.stock <= 0;

        detailDiv.innerHTML = `
            <button onclick="window.history.back()" class="back-btn">← 返回上一页</button>
            <div class="detail-layout">
                <h1>${book.title}</h1>
                <p>作者：${book.author} | ISBN：${book.isbn}</p>
                <p class="price">价格：￥${book.price.toFixed(2)}</p>
                <p>库存：<span style="color: ${isOutOfStock ? 'red' : 'green'}">${book.stock}</span></p>
                <p class="desc">${book.description}</p>
                
                <div class="action-area">
                    <input type="number" id="buyQty" value="1" min="1" ${isOutOfStock ? 'disabled' : ''}>
                    <button id="addBtn" 
                            onclick='addToCartHandler(${JSON.stringify(book)})' 
                            ${isOutOfStock ? 'disabled class="btn-disabled"' : 'class="primary-btn"'}>
                        ${isOutOfStock ? '库存不足' : '加入购物车'}
                    </button>
                </div>
            </div>
        `;
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

function navSearch() {
    const q = document.getElementById('navSearchInput').value;
    if (q) {
        window.location.href = `search.html?q=${encodeURIComponent(q)}`;
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