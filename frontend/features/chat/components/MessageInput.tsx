import { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { theme } from '@/constants/theme';

interface MessageInputProps {
  onSend: (text: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

export function MessageInput({ onSend, onTypingStart, onTypingStop }: MessageInputProps) {
  const [text, setText] = useState('');

  const handleSend = useCallback(() => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
    onTypingStop();
  }, [text, onSend, onTypingStop]);

  return (
    <View className="flex-row items-center bg-surface px-3 py-2 gap-2">
      <TextInput
        className="flex-1 bg-background rounded-full px-4 py-2.5 text-textPrimary text-base"
        placeholder="Message"
        placeholderTextColor={theme.textSecondary}
        value={text}
        onChangeText={(v) => {
          setText(v);
          if (v.length > 0) onTypingStart();
          else onTypingStop();
        }}
        onBlur={onTypingStop}
        multiline={false}
        maxLength={4096}
      />
      <TouchableOpacity
        onPress={handleSend}
        disabled={!text.trim()}
        className={`w-10 h-10 rounded-full items-center justify-center ${
          text.trim() ? 'bg-primary' : 'bg-background'
        }`}
      >
        <Text className="text-background text-lg font-bold">→</Text>
      </TouchableOpacity>
    </View>
  );
}
