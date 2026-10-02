import 'package:holistic_books/src/features/explore/data/explore_repository.dart';
import 'package:holistic_books/src/features/explore/domain/book.dart';
import 'package:holistic_books/src/features/explore/domain/genre.dart';
import 'package:holistic_books/src/features/explore/domain/reading_progress.dart';

class MockExploreRepository implements ExploreRepository {
  const MockExploreRepository();

  static const _atomicHabits = Book(
    id: 'atomic-habits',
    title: 'Un rien peut tout changer',
    authors: ['James Clear'],
    coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80',
    rating: 4.8,
    category: 'Développement personnel',
  );

  static const _designThings = Book(
    id: 'design-everyday-things',
    title: 'The Design of Everyday Things',
    authors: ['Don Norman'],
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&q=80',
    rating: 4.6,
    category: 'Design/Usabilité',
  );

  static const _uxLaws = Book(
    id: 'laws-of-ux',
    title: 'Laws of UX',
    authors: ['Jon Yablonski'],
    coverUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&q=80',
    rating: 4.5,
    category: 'Expérience utilisateur',
  );

  @override
  Future<Book?> getFeaturedBook() async {
    return const Book(
      id: 'featured',
      title: 'Refactoring UI',
      authors: ['Adam Wathan', 'Steve Schoger'],
      coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&q=80',
      rating: 4.9,
      category: 'Design UI',
    );
  }

  @override
  Future<List<ReadingProgress>> getReadingProgress() async {
    return const [
      ReadingProgress(
        book: Book(
          id: 'steal-like-an-artist',
          title: 'Steal Like an Artist',
          authors: ['Austin Kleon'],
          coverUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=500&q=80',
          rating: 4.7,
          category: 'Créativité',
        ),
        currentPage: 78,
        totalPages: 120,
        percentage: .45,
      ),
      ReadingProgress(
        book: Book(
          id: 'thinking-with-type',
          title: 'Thinking with Type',
          authors: ['Ellen Lupton'],
          coverUrl: 'https://images.unsplash.com/photo-1526243741027-444d633d7365?w=500&q=80',
          rating: 4.4,
          category: 'Typographie',
        ),
        currentPage: 90,
        totalPages: 150,
        percentage: .60,
      ),
      ReadingProgress(
        book: _atomicHabits,
        currentPage: 42,
        totalPages: 320,
        percentage: .18,
      ),
    ];
  }

  @override
  Future<List<Book>> getRecommendations() async {
    return const [
      _atomicHabits,
      _designThings,
      _uxLaws,
      Book(
        id: 'deep-work',
        title: 'Deep Work',
        authors: ['Cal Newport'],
        coverUrl: 'https://images.unsplash.com/photo-1511108690759-009324a90311?w=500&q=80',
        rating: 4.7,
        category: 'Productivité',
      ),
      Book(
        id: 'start-with-why',
        title: 'Start With Why',
        authors: ['Simon Sinek'],
        coverUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500&q=80',
        rating: 4.6,
        category: 'Leadership',
      ),
      Book(
        id: 'hooked',
        title: 'Hooked',
        authors: ['Nir Eyal'],
        coverUrl: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=500&q=80',
        rating: 4.5,
        category: 'Produit',
      ),
    ];
  }

  @override
  Future<List<Genre>> getGenres() async {
    return const [
      Genre(id: 'self', name: 'Développement personnel'),
      Genre(id: 'business', name: 'Business'),
      Genre(id: 'design', name: 'Design'),
      Genre(id: 'fiction', name: 'Roman'),
      Genre(id: 'tech', name: 'Technologie'),
      Genre(id: 'health', name: 'Santé'),
    ];
  }
}
