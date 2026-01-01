package com.example.bookshop.service;

import com.example.bookshop.entity.Book;
import com.example.bookshop.mapper.BookMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class BookService {

    @Autowired
    private BookMapper bookMapper; // 注入上面那个接口

    public List<Book> searchBooks(String keyword) {
        return bookMapper.searchBooks(keyword);
    }

    public Book getBookById(Integer id) {
        return bookMapper.getBookById(id);
    }

    public List<Book> getBooksByCategory(String category) {
        return bookMapper.getBooksByCategory(category);
    }
}