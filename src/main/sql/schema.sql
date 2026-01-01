CREATE DATABASE IF NOT EXISTS bookshop;
USE bookshop;

CREATE TABLE users (
                       user_id INT AUTO_INCREMENT PRIMARY KEY,
                       username VARCHAR(50) NOT NULL UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       email VARCHAR(100),
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE books (
                       book_id INT AUTO_INCREMENT PRIMARY KEY,
                       title VARCHAR(200) NOT NULL,
                       author VARCHAR(100) NOT NULL,
                       isbn VARCHAR(20) UNIQUE,
                       price DECIMAL(10,2) NOT NULL,
                       stock INT NOT NULL CHECK (stock >= 0),
                       category VARCHAR(50),
                       description TEXT
);

--一次购买
CREATE TABLE orders (
                        order_id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        total_amount DECIMAL(10,2) NOT NULL,
                        shipping_address VARCHAR(255),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(user_id)
);

--购买详情页
CREATE TABLE order_items (
                             order_item_id INT AUTO_INCREMENT PRIMARY KEY,
                             order_id INT NOT NULL,
                             book_id INT NOT NULL,
                             quantity INT NOT NULL,
                             price DECIMAL(10,2) NOT NULL,
                             FOREIGN KEY (order_id) REFERENCES orders(order_id),
                             FOREIGN KEY (book_id) REFERENCES books(book_id)
);