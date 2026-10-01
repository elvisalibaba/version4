import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:holistic_books/src/core/theme/app_colors.dart';
import 'package:holistic_books/src/core/theme/app_metrics.dart';
import 'package:holistic_books/src/features/explore/domain/book.dart';
import 'package:holistic_books/src/features/explore/domain/genre.dart';
import 'package:holistic_books/src/features/explore/domain/reading_progress.dart';
import 'package:holistic_books/src/features/explore/presentation/explore_controller.dart';
import 'package:holistic_books/src/features/explore/presentation/widgets/category_chip.dart';
import 'package:holistic_books/src/features/explore/presentation/widgets/continue_reading_card.dart';
import 'package:holistic_books/src/features/explore/presentation/widgets/featured_book_card.dart';
import 'package:holistic_books/src/features/explore/presentation/widgets/home_header.dart';
import 'package:holistic_books/src/features/explore/presentation/widgets/recommended_book_card.dart';
import 'package:holistic_books/src/features/explore/presentation/widgets/search_bar_field.dart';
import 'package:holistic_books/src/features/explore/presentation/widgets/section_state_view.dart';

class ExploreScreen extends ConsumerWidget {
  const ExploreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(exploreControllerProvider);
    final controller = ref.read(exploreControllerProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(
                AppMetrics.pageHorizontal,
                AppMetrics.largeGap,
                AppMetrics.pageHorizontal,
                AppMetrics.sectionSpacing,
              ),
              sliver: SliverList.list(
                children: [
                  const HomeHeader(),
                  const SizedBox(height: AppMetrics.sectionSpacing),
                  const SearchBarField(),
                  const SizedBox(height: AppMetrics.sectionSpacing),
                  _FeaturedSection(
                    state: state.featured,
                    onRetry: controller.loadFeatured,
                  ),
                  const SizedBox(height: AppMetrics.sectionSpacing),
                  const _SectionTitle('Continuer la lecture'),
                  const SizedBox(height: AppMetrics.mediumGap),
                  _ProgressSection(
                    state: state.progress,
                    onRetry: controller.loadProgress,
                  ),
                  const SizedBox(height: AppMetrics.sectionSpacing),
                  const _SectionTitle('Recommandés pour vous'),
                  const SizedBox(height: AppMetrics.mediumGap),
                  _RecommendationsSection(
                    state: state.recommendations,
                    onRetry: controller.loadRecommendations,
                  ),
                  const SizedBox(height: AppMetrics.sectionSpacing),
                  const _SectionTitle('Parcourir par genre'),
                  const SizedBox(height: AppMetrics.mediumGap),
                  _GenresSection(
                    state: state.genres,
                    onRetry: controller.loadGenres,
                  ),
                  const SizedBox(height: AppMetrics.sectionSpacing),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        fontSize: AppMetrics.sectionTitle,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimary,
      ),
    );
  }
}

class _FeaturedSection extends StatelessWidget {
  const _FeaturedSection({
    required this.state,
    required this.onRetry,
  });

  final SectionState<Book> state;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return switch (state.status) {
      SectionStatus.loading => const SectionLoadingSkeleton(
          height: AppMetrics.featuredHeight,
        ),
      SectionStatus.empty => const SectionEmptyState(
          message: 'Aucun livre à la une pour le moment.',
        ),
      SectionStatus.error => SectionErrorState(
          message: state.errorMessage ?? 'Une erreur est survenue.',
          onRetry: onRetry,
        ),
      SectionStatus.data => FeaturedBookCard(book: state.data!),
    };
  }
}

class _ProgressSection extends StatelessWidget {
  const _ProgressSection({
    required this.state,
    required this.onRetry,
  });

  final SectionState<List<ReadingProgress>> state;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return switch (state.status) {
      SectionStatus.loading => const SectionLoadingSkeleton(),
      SectionStatus.empty => const SectionEmptyState(
          message: 'Aucune lecture en cours.',
        ),
      SectionStatus.error => SectionErrorState(
          message: state.errorMessage ?? 'Une erreur est survenue.',
          onRetry: onRetry,
        ),
      SectionStatus.data => SizedBox(
          height: AppMetrics.continueCardHeight,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: state.data!.length,
            separatorBuilder: (_, _) => const SizedBox(width: AppMetrics.mediumGap),
            itemBuilder: (context, index) {
              return ContinueReadingCard(progress: state.data![index]);
            },
          ),
        ),
    };
  }
}

class _RecommendationsSection extends StatelessWidget {
  const _RecommendationsSection({
    required this.state,
    required this.onRetry,
  });

  final SectionState<List<Book>> state;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return switch (state.status) {
      SectionStatus.loading => const SectionLoadingSkeleton(
          height: AppMetrics.recommendedCoverHeight,
        ),
      SectionStatus.empty => const SectionEmptyState(
          message: 'Aucune recommandation pour le moment.',
        ),
      SectionStatus.error => SectionErrorState(
          message: state.errorMessage ?? 'Une erreur est survenue.',
          onRetry: onRetry,
        ),
      SectionStatus.data => SizedBox(
          height: AppMetrics.recommendedCoverHeight + 48,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: state.data!.length,
            separatorBuilder: (_, _) => const SizedBox(width: AppMetrics.mediumGap),
            itemBuilder: (context, index) {
              return RecommendedBookCard(book: state.data![index]);
            },
          ),
        ),
    };
  }
}

class _GenresSection extends StatelessWidget {
  const _GenresSection({
    required this.state,
    required this.onRetry,
  });

  final SectionState<List<Genre>> state;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return switch (state.status) {
      SectionStatus.loading => const SectionLoadingSkeleton(height: AppMetrics.genreSkeletonHeight),
      SectionStatus.empty => const SectionEmptyState(
          message: 'Aucun genre disponible.',
        ),
      SectionStatus.error => SectionErrorState(
          message: state.errorMessage ?? 'Une erreur est survenue.',
          onRetry: onRetry,
        ),
      SectionStatus.data => Wrap(
          spacing: AppMetrics.smallGap,
          runSpacing: AppMetrics.smallGap,
          children: state.data!
              .map((genre) => CategoryChip(label: genre.name))
              .toList(growable: false),
        ),
    };
  }
}
