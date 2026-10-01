import 'package:flutter/material.dart';
import 'package:holistic_books/src/core/constants/app_colors.dart';

class AppTheme {
  static ThemeData get light => ThemeData(
        useMaterial3: true,
        fontFamily: 'Poppins',
        scaffoldBackgroundColor: AppColors.background,
        colorScheme: const ColorScheme.light(
          primary: AppColors.primary,
          secondary: AppColors.primaryLight,
          surface: AppColors.white,
          error: AppColors.danger,
          onPrimary: AppColors.white,
          onSurface: AppColors.ink,
        ),
        textTheme: const TextTheme(
          headlineLarge: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, height: 1.05, color: AppColors.ink),
          headlineMedium: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.ink),
          headlineSmall: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.ink),
          titleMedium: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.ink),
          bodyMedium: TextStyle(fontSize: 13, height: 1.35, color: AppColors.mutedInk),
          labelLarge: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.background,
          foregroundColor: AppColors.ink,
          elevation: 0,
          centerTitle: false,
          surfaceTintColor: Colors.transparent,
        ),
        cardTheme: CardThemeData(
          color: AppColors.white,
          elevation: 0,
          surfaceTintColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        ),
        navigationBarTheme: const NavigationBarThemeData(
          height: 68,
          backgroundColor: AppColors.white,
          indicatorColor: AppColors.softBlue,
          labelTextStyle: WidgetStatePropertyAll(
            TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.ink),
          ),
        ),
      );

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        fontFamily: 'Poppins',
        colorScheme: ColorScheme.fromSeed(
          brightness: Brightness.dark,
          seedColor: AppColors.primary,
        ),
      );
}
