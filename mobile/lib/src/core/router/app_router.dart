import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/core/widgets/app_shell.dart';
import 'package:holistic_books/src/features/auth/presentation/login_screen.dart';
import 'package:holistic_books/src/features/auth/presentation/register_screen.dart';
import 'package:holistic_books/src/features/auth/presentation/verify_email_screen.dart';
import 'package:holistic_books/src/features/books/presentation/book_detail_screen.dart';
import 'package:holistic_books/src/features/explore/presentation/explore_screen.dart';
import 'package:holistic_books/src/features/reader/presentation/reader_screen.dart';
import 'package:holistic_books/src/shared/widgets/placeholder_tab_screen.dart';

final appRouterProvider = Provider<GoRouter>((_) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (_, _, navigationShell) => AppShell(
          navigationShell: navigationShell,
        ),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/', builder: (_, _) => const ExploreScreen()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/library',
                builder: (_, _) => const PlaceholderTabScreen(
                  title: 'Bibliothèque',
                  icon: Icons.local_library_rounded,
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/community',
                builder: (_, _) => const PlaceholderTabScreen(
                  title: 'Communauté',
                  icon: Icons.groups_rounded,
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                builder: (_, _) => const PlaceholderTabScreen(
                  title: 'Profil',
                  icon: Icons.person_rounded,
                ),
              ),
            ],
          ),
        ],
      ),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
      GoRoute(
        path: '/verify-email',
        builder: (_, state) => VerifyEmailScreen(
          email: state.uri.queryParameters['email'] ?? '',
        ),
      ),
      GoRoute(
        path: '/books/:id',
        builder: (_, state) => BookDetailScreen(
          bookId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/reader/:id',
        builder: (_, state) => ReaderScreen(
          bookId: state.pathParameters['id']!,
        ),
      ),
    ],
  );
});
