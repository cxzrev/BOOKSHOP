package com.example.bookshop.mapper;

import com.example.bookshop.entity.Book;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface BookMapper {
    @Select("SELECT book_id as bookId, title, author, price, stock, category, description " +
            "FROM books WHERE LOWER(title) LIKE LOWER(CONCAT('%', #{q}, '%')) " +
            "OR LOWER(author) LIKE LOWER(CONCAT('%', #{q}, '%')) " +
            "OR isbn LIKE CONCAT('%', #{q}, '%')")
    List<Book> searchBooks(@Param("q") String q);

    @Select("<script>" +
            "SELECT book_id as bookId, title, author, price, stock, category, description FROM books " +
            "<if test=\"type != 'all'\">WHERE category = #{type}</if>" +
            "</script>")
    List<Book> getBooksByCategory(@Param("type") String type);

    @Select("SELECT book_id as bookId, title, author, price, stock, category, description, isbn FROM books WHERE book_id = #{id}")
    Book getBookById(Integer id);

    @Select("SELECT * FROM books WHERE book_id = #{id} FOR UPDATE")
    Book selectBookForUpdate(Integer id);

    @Update("UPDATE books SET stock = stock - #{quantity} WHERE book_id = #{id}")
    void reduceStock(Integer id, Integer quantity);

    @Insert("INSERT INTO order_items(order_id, book_id, quantity, price) " +
            "VALUES(#{orderId}, #{bookId}, #{quantity}, #{price})")
    void insertOrderItem(@Param("orderId") Integer orderId,
                         @Param("bookId") Integer bookId,
                         @Param("quantity") Integer quantity,
                         @Param("price") Double price);
}