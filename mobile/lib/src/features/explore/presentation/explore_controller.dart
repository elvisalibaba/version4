import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:holistic_books/src/features/explore/data/explore_repository.dart';
import 'package:holistic_books/src/features/explore/data/mock_explore_repository.dart';
import 'package:holistic_books/src/features/explore/domain/book.dart';
import 'package:holistic_books/src/features/explore/domain/genre.dart';
import 'package:holistic_books/src/features/explore/domain/reading_progress.dart';

enum SectionStatus { loading, data, empty, error }

class SectionState<T> {
  const SectionState._({
    required this.status,
    this.data,
    this.errorMessage,
  });

  const SectionState.loading() : this._(status: SectionStatus.loading);
  const SectionState.data(T data) : this._(status: SectionStatus.data, data: data);
  const SectionState.empty() : this._(status: SectionStatus.empty);
  const SectionState.error(String message)
      : this._(status: SectionStatus.error, errorMessage: message);

  final SectionStatus status;
  final T? data;
  final String? errorMessage;
}

class ExploreState {
  const ExploreState({
    this.featured = const SectionState.loading(),
    this.progress = const SectionState.loading(),
    this.recommendations = const SectionState.loading(),
    this.genres = const SectionState.loading(),
  });

  final SectionState<Book> featured;
  final SectionState<List<ReadingProgress>> progress;
  final SectionState<List<Book>> recommendations;
  final SectionState<List<Genre>> genres;

  ExploreState copyWith({
    SectionState<Book>? featured,
    SectionState<List<ReadingProgress>>? progress,
    SectionState<List<Book>>? recommendations,
    SectionState<List<Genre>>? genres,
  }) {
    return ExploreState(
      featured: featured ?? this.featured,
      progress: progress ?? this.progress,
      recommendations: recommendations ?? this.recommendations,
      genres: genres ?? this.genres,
    );
  }
}

final exploreRepositoryProvider = Provider<ExploreRepository>(
  (_) => const MockExploreRepository(),
);

final exploreControllerProvider =
    NotifierProvider<ExploreController, ExploreState>(ExploreController.new);

class ExploreController extends Notifier<ExploreState> {
  late ExploreRepository _repository;

  @override
  ExploreState build() {
    _repository = ref.watch(exploreRepositoryProvider);
    Future<void>.microtask(loadAll);
    return const ExploreState();
  }

  Future<void> loadAll() async {
    await Future.wait([
      loadFeatured(),
      loadProgress(),
      loadRecommendations(),
      loadGenres(),
    ]);
  }

  Future<void> loadFeatured() async {
    state = state.copyWith(featured: const SectionState.loading());
    try {
      final book = await _repository.getFeaturedBook();
      state = state.copyWith(
        featured: book == null ? const SectionState.empty() : SectionState.data(book),
      );
    } catch (_) {
      state = state.copyWith(
        featured: const SectionState.error('Impossible de charger le livre à la une.'),
      );
    }
  }

  Future<void> loadProgress() async {
    state = state.copyWith(progress: const SectionState.loading());
    try {
      final items = await _repository.getReadingProgress();
      state = state.copyWith(
        progress: items.isEmpty ? const SectionState.empty() : SectionState.data(items),
      );
    } catch (_) {
      state = state.copyWith(
        progress: const SectionState.error('Impossible de charger vos lectures.'),
      );
    }
  }

  Future<void> loadRecommendations() async {
    state = state.copyWith(recommendations: const SectionState.loading());
    try {
      final items = await _repository.getRecommendations();
      state = state.copyWith(
        recommendations:
            items.isEmpty ? const SectionState.empty() : SectionState.data(items),
      );
    } catch (_) {
      state = state.copyWith(
        recommendations:
            const SectionState.error('Impossible de charger les recommandations.'),
      );
    }
  }

  Future<void> loadGenres() async {
    state = state.copyWith(genres: const SectionState.loading());
    try {
      final items = await _repository.getGenres();
      state = state.copyWith(
        genres: items.isEmpty ? const SectionState.empty() : SectionState.data(items),
      );
    } catch (_) {
      state = state.copyWith(
        genres: const SectionState.error('Impossible de charger les genres.'),
      );
    }
  }
}
