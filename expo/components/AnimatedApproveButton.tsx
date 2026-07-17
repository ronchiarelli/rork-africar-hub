import React, { useCallback, useRef } from 'react';
import { Animated, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface AnimatedApproveButtonProps {
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  testID?: string;
}

// Shared press feedback for "Approve" actions: a quick press-scale bounce
// plus a checkmark pulse fired the instant the button is tapped. Approving
// an item almost always removes it from the list a moment later (once the
// mutation's query invalidation resolves), leaving little time for a
// "success" state — firing the pulse immediately on press, in parallel with
// the real mutation, is what makes it visible at all.
export default function AnimatedApproveButton({ onPress, disabled, style, children, testID }: AnimatedApproveButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(0.5)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  }, [scale]);

  const handlePress = useCallback(() => {
    pulseOpacity.setValue(1);
    pulseScale.setValue(0.5);
    Animated.parallel([
      Animated.timing(pulseScale, { toValue: 1.3, duration: 450, useNativeDriver: true }),
      Animated.timing(pulseOpacity, { toValue: 0, duration: 450, delay: 100, useNativeDriver: true }),
    ]).start();
    onPress();
  }, [onPress, pulseOpacity, pulseScale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={style}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        testID={testID}
      >
        {children}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulse,
            { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
          ]}
        >
          <CheckCircle2 size={20} color={Colors.white} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pulse: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.success,
    borderRadius: 12,
  },
});
