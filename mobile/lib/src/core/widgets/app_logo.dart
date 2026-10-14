import 'package:flutter/material.dart';

class AppLogo extends StatefulWidget {
  const AppLogo({super.key, this.size = 54});
  final double size;

  @override
  State<AppLogo> createState() => _AppLogoState();
}

class _AppLogoState extends State<AppLogo> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 650),
  )..forward();

  late final Animation<double> _scale = CurvedAnimation(
    parent: _controller,
    curve: Curves.easeOutBack,
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final image = SizedBox(
      width: widget.size,
      height: widget.size,
      child: Image.asset(
        'assets/brand/icon-blue.png',
        fit: BoxFit.contain,
        semanticLabel: 'Holistique Books',
      ),
    );
    if (MediaQuery.disableAnimationsOf(context)) return image;
    return FadeTransition(
      opacity: _controller,
      child: ScaleTransition(scale: _scale, child: image),
    );
  }
}
