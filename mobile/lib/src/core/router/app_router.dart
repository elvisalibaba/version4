import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/features/auth/presentation/login_screen.dart';
import 'package:holistic_books/src/features/books/presentation/book_detail_screen.dart';
import 'package:holistic_books/src/features/home/presentation/home_screen.dart';
import 'package:holistic_books/src/features/reader/presentation/reader_screen.dart';

final appRouterProvider = Provider<GoRouter>((_) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(
        path: '/books/:id',
        builder: (_, state) => BookDetailScreen(bookId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/reader/:id',
        builder: (_, state) => ReaderScreen(bookId: state.pathParameters['id']!),
      ),
    ],
  );
});
