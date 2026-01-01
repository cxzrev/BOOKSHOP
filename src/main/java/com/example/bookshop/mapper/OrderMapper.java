package com.example.bookshop.mapper;
import com.example.bookshop.entity.Order;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Map;

@Mapper
public interface OrderMapper {
    @Insert("INSERT INTO orders(user_id, total_amount, shipping_address) VALUES(#{userId}, #{totalAmount}, #{shippingAddress})")
    @Options(useGeneratedKeys = true, keyProperty = "orderId")
    void insertOrder(Order order);

    @Insert("INSERT INTO order_items(order_id, book_id, quantity, price) " +
            "VALUES(#{orderId}, #{bookId}, #{quantity}, #{price})")
    void insertOrderItem(@Param("orderId") Integer orderId,
                         @Param("bookId") Integer bookId,
                         @Param("quantity") Integer quantity,
                         @Param("price") Double price);


    @Select("SELECT o.order_id as orderId, " +
            "o.total_amount as totalPrice, " +
            "o.created_at as createTime, " +
            "oi.book_id as bookId, " +
            "oi.quantity, " +
            "b.title " +
            "FROM orders o " +
            "JOIN order_items oi ON o.order_id = oi.order_id " +
            "JOIN books b ON oi.book_id = b.book_id " +
            "WHERE o.user_id = #{userId} " +
            "ORDER BY o.created_at DESC")
    List<Map<String, Object>> getOrderHistoryRaw(@Param("userId") Integer userId);
}