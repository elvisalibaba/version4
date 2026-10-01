import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/core/widgets/app_shell.dart';
import 'package:holistic_books/src/features/auth/presentation/login_screen.dart';
import 'package:holistic_books/src/features/auth/presentation/register_screen.dart';
import 'package:holistic_books/src/features/auth/presentation/verify_email_screen.dart';
import 'package:holistic_books/src/features/books/presentation/book_detail_screen.dart';
import 'package:holistic_books/src/features/discover/presentation/discover_screen.dart';
import 'package:holistic_books/src/features/home/presentation/home_screen.dart';
import 'package:holistic_books/src/features/library/presentation/library_screen.dart';
import 'package:holistic_books/src/features/profile/presentation/profile_screen.dart';
import 'package:holistic_books/src/features/reader/presentation/reader_screen.dart';

final appRouterProvider = Provider<GoRouter>((_) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (_, _, navigationShell) => AppShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/', builder: (_, _) => const HomeScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/discover', builder: (_, _) => const DiscoverScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/library', builder: (_, _) => const LibraryScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/profile', builder: (_, _) => const ProfileScreen()),
          ]),
        ],
      ),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
      GoRoute(
        path: '/verify-email',
        builder: (_, state) => VerifyEmailScreen(email: state.uri.queryParameters['email'] ?? ''),
      ),
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
