import { useState, type ReactNode } from 'react';
import { Pressable, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ActionSheet, type ActionSheetItem } from './ActionSheet';

export interface ContextMenuProps {
  children: ReactNode;
  actions: ActionSheetItem[];
  title?: string;
  style?: ViewStyle;
}

export function ContextMenu({ children, actions, title, style }: ContextMenuProps) {
  const [visible, setVisible] = useState(false);

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVisible(true);
  };

  return (
    <>
      <Pressable onLongPress={handleLongPress} delayLongPress={400} style={style}>
        {children}
      </Pressable>
      <ActionSheet
        visible={visible}
        onClose={() => setVisible(false)}
        title={title}
        actions={actions}
      />
    </>
  );
}
