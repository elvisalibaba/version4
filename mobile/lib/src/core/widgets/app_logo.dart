import 'package:flutter/material.dart';
import 'package:holistic_books/src/core/constants/app_colors.dart';

class AppLogo extends StatelessWidget {
  const AppLogo({super.key, this.size = 54});
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(size * .28),
      ),
      alignment: Alignment.center,
      child: Text(
        'H',
        style: TextStyle(
          color: AppColors.white,
          fontSize: size * .48,
          fontWeight: FontWeight.w800,
          height: 1,
        ),
      ),
    );
  }
}
