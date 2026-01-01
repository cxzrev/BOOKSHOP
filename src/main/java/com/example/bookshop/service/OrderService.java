package com.example.bookshop.service;
import com.example.bookshop.mapper.OrderMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.Map;

import com.example.bookshop.entity.*;
import com.example.bookshop.mapper.BookMapper;
import com.example.bookshop.mapper.*;

@Service
public class OrderService {

    @Autowired
    private BookMapper bookMapper; // 假设你使用 MyBatis 查库
    @Autowired
    private OrderMapper orderMapper;

    @Transactional(rollbackFor = Exception.class) // ✅ 对应队友代码的 db.commit() 和 rollback()
    public void checkout(Integer userId, Map<String, Integer> cart) throws Exception {
        double totalAmount = 0;

        // 1. 校验库存并计算总额 (对应队友代码的 FOR UPDATE 逻辑)
        for (String bookIdStr : cart.keySet()) {
            Integer bookId = Integer.parseInt(bookIdStr);
            Integer quantity = cart.get(bookIdStr);

            // 锁定行进行库存查询
            Book book = bookMapper.selectBookForUpdate(bookId);
            if (book == null) throw new Exception("图书不存在");
            if (book.getStock() < quantity) throw new Exception("库存不足: " + book.getTitle());

            totalAmount += book.getPrice() * quantity;
        }

        // 2. 创建主订单
        Order order = new Order();
        order.setUserId(userId);
        order.setTotalAmount(totalAmount);
        orderMapper.insertOrder(order);
        Integer orderId = order.getOrderId();

        // 3. 创建明细并减库存
        for (String bookIdStr : cart.keySet()) {
            Integer bookId = Integer.parseInt(bookIdStr);
            Integer quantity = cart.get(bookIdStr);

            Book book = bookMapper.getBookById(bookId);
            if (book == null) throw new RuntimeException("书籍不存在");

            orderMapper.insertOrderItem(orderId, bookId, quantity, book.getPrice());
            // 扣减库存 (UPDATE books SET stock = stock - qty)
            bookMapper.reduceStock(bookId, quantity);
        }
    }
}