import 'package:flutter/material.dart';
import 'package:holistic_books/src/core/constants/app_colors.dart';

class AuthBackground extends StatelessWidget {
  const AuthBackground({required this.child, super.key});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppColors.background,
      child: Stack(
        children: [
          Positioned(
            top: -120,
            left: -90,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                color: AppColors.softBlue,
                borderRadius: BorderRadius.circular(160),
              ),
            ),
          ),
          Positioned(
            top: 110,
            right: -125,
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.primaryLight.withValues(alpha: .18), width: 18),
                shape: BoxShape.circle,
              ),
            ),
          ),
          child,
        ],
      ),
    );
  }
}
