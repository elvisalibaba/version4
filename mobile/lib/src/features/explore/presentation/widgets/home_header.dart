import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:holistic_books/src/core/theme/app_colors.dart';
import 'package:holistic_books/src/core/theme/app_metrics.dart';

class HomeHeader extends StatelessWidget {
  const HomeHeader({
    super.key,
    this.initial = 'E',
  });

  final String initial;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            'HolisticBooks',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.merriweather(
              fontSize: AppMetrics.logo,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
        ),
        Semantics(
          label: 'Profil utilisateur',
          button: true,
          child: CircleAvatar(
            radius: AppMetrics.avatar / 2,
            backgroundColor: AppColors.primary,
            child: Text(
              initial,
              style: const TextStyle(
                color: AppColors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
