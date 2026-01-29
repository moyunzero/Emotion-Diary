/**
 * 焚烧动画组件 - 独立提取，支持懒加载
 * 将 Skia 相关代码分离，减少主包体积
 */
import { Canvas, Fill, ImageShader, Shader, SkImage, Skia } from '@shopify/react-native-skia';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

interface BurnAnimationProps {
  snapshot: SkImage;
  width: number;
  height: number;
  onComplete: () => void;
}

const burnShaderCode = `
uniform shader image;
uniform float progress;

// 伪随机函数
float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// 噪声函数
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

vec4 main(vec2 pos) {
    vec4 color = image.eval(pos);
    if (color.a == 0.0) {
        return vec4(0.0);
    }

    // 噪声缩放
    float n = noise(pos / 20.0);
    
    // 阈值计算
    float t = progress * 1.4 - 0.2; 

    if (n < t) {
        // 烧毁区域：完全透明
        return vec4(0.0); 
    } 
    
    float edge = n - t;
    
    if (edge < 0.05) {
        // 内层火焰：亮黄色/白色
        return vec4(1.0, 0.9, 0.5, 1.0);
    } else if (edge < 0.15) {
        // 外层火焰：橙红色
        return vec4(1.0, 0.4, 0.0, 1.0);
    } else if (edge < 0.25) {
        // 焦黑边缘：深褐色/黑色，与原图混合
        return mix(vec4(0.2, 0.1, 0.0, 1.0), color, (edge - 0.15) * 10.0);
    }
    
    return color;
}
`;

// 预编译 Shader
let runtimeEffect: any = null;
try {
  runtimeEffect = Skia.RuntimeEffect.Make(burnShaderCode);
} catch (e) {
  console.warn('Skia RuntimeEffect创建失败:', e);
  runtimeEffect = null;
}

const BurnAnimation: React.FC<BurnAnimationProps> = ({ snapshot, width, height, onComplete }) => {
  const [burnProgress, setBurnProgress] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    if (!runtimeEffect) {
      // 如果 Skia 不可用，直接完成
      onComplete();
      return;
    }

    // 开始动画
    let start = performance.now();
    const duration = 2000;
    let lastUpdateTime = start;
    let lastProgress = 0;

    const animate = (time: number) => {
      // 先检查是否已卸载，避免不必要的计算
      if (!isMountedRef.current) {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }

      const elapsed = time - start;
      const p = Math.min(elapsed / duration, 1);

      // 优化：只在进度有明显变化时更新状态
      const timeSinceLastUpdate = time - lastUpdateTime;
      const progressChange = Math.abs(p - lastProgress);

      if (timeSinceLastUpdate >= 16 || progressChange >= 0.02 || p >= 1) {
        // 再次检查是否已卸载，避免在卸载后更新状态
        if (isMountedRef.current) {
          setBurnProgress(p);
        }
        lastProgress = p;
        lastUpdateTime = time;
      }

      if (p < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // 动画结束，再次检查是否已卸载
        if (isMountedRef.current) {
          setBurnProgress(1);
          onComplete();
        }
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // 清理函数 - 确保在组件卸载时取消动画
    return () => {
      isMountedRef.current = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [onComplete]);

  if (!runtimeEffect) {
    return null;
  }

  return (
    <View style={[styles.container, { width, height }]}>
      <Canvas style={{ flex: 1 }}>
        <Fill>
          <Shader source={runtimeEffect} uniforms={{ progress: burnProgress }}>
            <ImageShader
              image={snapshot}
              fit="cover"
              rect={{ x: 0, y: 0, width, height }}
            />
          </Shader>
        </Fill>
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default BurnAnimation;
