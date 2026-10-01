import 'package:flutter/material.dart';

class AppTheme {
  static const _green = Color(0xFF173F38);
  static const _orange = Color(0xFFE85D3F);
  static const _gold = Color(0xFFF5B942);
  static const _cream = Color(0xFFF8F4ED);

  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: _green,
          primary: _green,
          secondary: _orange,
          tertiary: _gold,
          surface: _cream,
        ),
        scaffoldBackgroundColor: _cream,
      );

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(
          brightness: Brightness.dark,
          seedColor: _green,
          primary: _gold,
          secondary: _orange,
        ),
      );
}
