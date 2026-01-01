package com.example.bookshop.controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import java.util.List;
import java.util.Collections;
import java.util.ArrayList;
import java.util.Map;

import com.example.bookshop.entity.Book;
import com.example.bookshop.service.BookService;
import com.example.bookshop.util.Result;

@RestController
@RequestMapping("/api")
public class BookController {

    @Autowired
    private BookService bookService;

    /**
    @GetMapping("/search")
    public List<Book> search(@RequestParam(value = "q", defaultValue = "") String q) {
        return bookService.searchBooks(q.trim().toLowerCase());
    }
    **/
    @GetMapping("/search")
    public Result search(@RequestParam("q") String q) {
        return Result.success(bookService.searchBooks(q));
    }

    @GetMapping("/book/{id}")
    public Result getBook(@PathVariable Integer id) {
        Book book = bookService.getBookById(id);
        return book != null ? Result.success(book) : Result.error(404, "书没找到");
    }

    @GetMapping("/books/category")
    public Result getByCategory(@RequestParam("type") String type) {
        List<Book> list = bookService.getBooksByCategory(type);
        return Result.success(list); // 这样 result.code 就是 200，result.data 就是书籍列表
    }
}