from flask import Flask
from flask_session import Session
from flask import request, jsonify, session
import bcrypt
from db import get_db


app = Flask(__name__)
app.config['SESSION_TYPE'] = 'filesystem'
app.secret_key = 'dev-secret-key'

Session(app)

@app.route('/')
def index():
    return "Backend is running"


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json(silent=True)
    if not data or 'username' not in data or 'password' not in data or 'confirm_password' not in data:
        return jsonify({'error': '缺少必要字段'}), 400

    username = data['username']
    password = data['password']
    confirm_password = data['confirm_password']

    if not username or not password:
        return jsonify({'error': '用户名或密码不能为空'}), 400

    if len(password) < 6:
        return jsonify({'error': '密码长度不能小于6位'}), 400

    if password != confirm_password:
        return jsonify({'error': '两次输入的密码不一致'}), 400

    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    db = get_db()
    cursor = db.cursor()

    try:
        # ✅ 修正：去掉 email（或确保它被正确定义）
        cursor.execute(
            "INSERT INTO users (username, password_hash) VALUES (%s, %s)",
            (username, password_hash)
        )
        db.commit()
    except Exception as e:
        db.rollback()
        # 🔍 可改进：区分具体错误（如用户名重复 vs 其他）
        return jsonify({'error': '用户名已存在'}), 409
    finally:
        cursor.close()
        db.close()

    return jsonify({'message': '注册成功'})

 
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({'error': '请求体不是合法 JSON'}), 400

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': '用户名或密码不能为空'}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        "SELECT user_id, username, password_hash FROM users WHERE username = %s",
        (username,)
    )
    user = cursor.fetchone()

    cursor.close()
    db.close()

    # 用户不存在或密码错误（不区分，防止泄露信息）
    if not user or not bcrypt.checkpw(
        password.encode('utf-8'),
        user['password_hash'].encode('utf-8')
        if isinstance(user['password_hash'], str)
        else user['password_hash']
    ):
        return jsonify({'error': '用户名或密码错误'}), 401

    # 登录成功，建立会话
    session['user_id'] = user['user_id']

    return jsonify({'message': '登录成功'})


@app.route('/api/me', methods=['GET'])
def me():
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'loggedIn': False})

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        "SELECT username FROM users WHERE user_id = %s",
        (user_id,)
    )
    user = cursor.fetchone()

    cursor.close()
    db.close()

    if not user:
        return jsonify({'loggedIn': False})

    return jsonify({
        'loggedIn': True,
        'username': user['username']
    })

@app.route('/api/search', methods=['GET'])
def search_books():
    keyword = request.args.get('q', '').strip()

    if not keyword:
        return jsonify([])

    db = get_db()
    cursor = db.cursor(dictionary=True)

    sql = """
        SELECT 
            book_id, 
            title, 
            author, 
            price, 
            category,
            -- 修改点 3: 添加库存状态
            CASE 
                WHEN stock > 0 THEN '有货' 
                ELSE '缺货' 
            END AS stock_status
        FROM books
        WHERE LOWER(title) LIKE LOWER(%s)
           OR LOWER(author) LIKE LOWER(%s)
           OR isbn LIKE %s   -- ISBN 通常区分大小写，且是精确匹配的一部分，保留原样
    """
    pattern = f"%{keyword}%"
    cursor.execute(sql, (pattern, pattern, pattern))
    books = cursor.fetchall()

    cursor.close()
    db.close()

    return jsonify(books)

# ===== 购物车相关 API =====

@app.route('/api/cart', methods=['GET'])
def get_cart():
    cart = session.get('cart', {})
    if not cart:
        return jsonify({'items': [], 'total_amount': 0.0})

    db = get_db()
    cursor = db.cursor(dictionary=True)

    book_ids = list(cart.keys())
    placeholders = ','.join(['%s'] * len(book_ids))
    cursor.execute(f"SELECT book_id, title, author, price, stock FROM books WHERE book_id IN ({placeholders})", book_ids)
    books = cursor.fetchall()
    db.close()

    items = []
    total = 0
    for book in books:
        bid = str(book['book_id'])
        qty = cart[bid]
        # 如果库存不足，前端应提示，但这里仍返回（由结账时校验）
        item_total = book['price'] * qty
        items.append({
            'book_id': book['book_id'],
            'title': book['title'],
            'author': book['author'],
            'price': float(book['price']),
            'quantity': qty,
            'stock': book['stock'],
            'subtotal': float(item_total)
        })
        total += item_total

    return jsonify({
        'items': items,
        'total_amount': float(total)
    })


@app.route('/api/cart', methods=['POST'])
def add_to_cart():
    data = request.get_json(silent=True)
    if not data or 'book_id' not in data:
        return jsonify({'error': '缺少 book_id'}), 400

    book_id = data['book_id']
    quantity = data.get('quantity', 1)

    if not isinstance(quantity, int) or quantity <= 0:
        return jsonify({'error': '数量必须为正整数'}), 400

    # 验证图书是否存在
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT book_id FROM books WHERE book_id = %s", (book_id,))
    exists = cursor.fetchone()
    db.close()

    if not exists:
        return jsonify({'error': '图书不存在'}), 404

    # 更新购物车（session）
    cart = session.get('cart', {})
    key = str(book_id)
    cart[key] = cart.get(key, 0) + quantity
    session['cart'] = cart

    return jsonify({'message': '已加入购物车'})


@app.route('/api/cart/<int:book_id>', methods=['DELETE'])
def remove_from_cart(book_id):
    cart = session.get('cart', {})
    key = str(book_id)
    if key in cart:
        del cart[key]
        session['cart'] = cart
    return jsonify({'message': '已移除'})

@app.route('/api/book/<int:book_id>', methods=['GET'])
def get_book(book_id):
    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM books WHERE book_id = %s",
        (book_id,)
    )
    book = cursor.fetchone()

    cursor.close()
    db.close()

    if not book:
        return jsonify({'error': '图书不存在'}), 404

    return jsonify(book)

@app.route('/api/checkout', methods=['POST'])
def checkout():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': '请先登录'}), 401

    # ✅ 从 session 购物车读取商品（不再接收前端传 items）
    cart = session.get('cart', {})
    if not cart:
        return jsonify({'error': '购物车为空，无法结算'}), 400  # 新增校验

    # 将 cart 转为 [{'book_id': ..., 'quantity': ...}, ...]
    items = []
    for book_id_str, quantity in cart.items():
        try:
            book_id = int(book_id_str)
            if quantity <= 0:
                continue  # 忽略无效数量（或可报错）
            items.append({'book_id': book_id, 'quantity': quantity})
        except (ValueError, TypeError):
            continue  # 跳过非法 key

    if not items:
        return jsonify({'error': '购物车中无有效商品'}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        total_amount = 0

        # 1. 校验库存 & 计算总价
        for item in items:
            cursor.execute(
                "SELECT price, stock FROM books WHERE book_id = %s FOR UPDATE",
                (item['book_id'],)
            )
            book = cursor.fetchone()

            if not book:
                raise ValueError('图书不存在')

            if book['stock'] < item['quantity']:
                raise ValueError('库存不足')

            if item['quantity'] <= 0:
                raise ValueError('购买数量必须大于0')

            total_amount += book['price'] * item['quantity']

        # 2. 创建订单
        cursor.execute(
            "INSERT INTO orders (user_id, total_amount) VALUES (%s, %s)",
            (user_id, total_amount)
        )
        order_id = cursor.lastrowid

        # 3. 创建订单明细 + 扣减库存
        for item in items:
            cursor.execute(
                "SELECT price FROM books WHERE book_id = %s",
                (item['book_id'],)
            )
            price = cursor.fetchone()['price']

            cursor.execute(
                """
                INSERT INTO order_items (order_id, book_id, quantity, price)
                VALUES (%s, %s, %s, %s)
                """,
                (order_id, item['book_id'], item['quantity'], price)
            )

            cursor.execute(
                "UPDATE books SET stock = stock - %s WHERE book_id = %s",
                (item['quantity'], item['book_id'])
            )

        # ✅ 4. 清空购物车（关键！）
        session.pop('cart', None)

        db.commit()

    except ValueError as e:
        db.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.rollback()
        app.logger.error(f"Checkout system error: {e}")
        return jsonify({'error': '系统繁忙，请稍后再试'}), 500
    finally:
        cursor.close()
        db.close()

    return jsonify({
        'message': '订单创建成功',
        'order_id': order_id,
        'total_amount': float(total_amount)
    })

@app.route('/api/logout', methods=['POST'])
def logout():
    # 清除当前用户的会话
    session.pop('user_id', None)
    return jsonify({'message': '已成功退出登录'})


if __name__ == '__main__':
    app.run(debug=True)
