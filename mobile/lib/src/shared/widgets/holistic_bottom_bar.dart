import 'package:flutter/material.dart';
import 'package:holistic_books/src/core/theme/app_colors.dart';

class HolisticBottomBar extends StatelessWidget {
  const HolisticBottomBar({
    required this.currentIndex,
    required this.onDestinationSelected,
    super.key,
  });

  final int currentIndex;
  final ValueChanged<int> onDestinationSelected;

  @override
  Widget build(BuildContext context) {
    return NavigationBar(
      selectedIndex: currentIndex,
      onDestinationSelected: onDestinationSelected,
      backgroundColor: AppColors.white,
      indicatorColor: AppColors.surfaceStrong,
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home_rounded),
          label: 'Accueil',
        ),
        NavigationDestination(
          icon: Icon(Icons.explore_outlined),
          selectedIcon: Icon(Icons.explore_rounded),
          label: 'Découvrir',
        ),
        NavigationDestination(
          icon: Icon(Icons.local_library_outlined),
          selectedIcon: Icon(Icons.local_library_rounded),
          label: 'Bibliothèque',
        ),
        NavigationDestination(
          icon: Icon(Icons.person_outline_rounded),
          selectedIcon: Icon(Icons.person_rounded),
          label: 'Profil',
        ),
      ],
    );
  }
}
