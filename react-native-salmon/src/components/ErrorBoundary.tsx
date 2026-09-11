import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={Colors.urgentRed} />
            <Text style={styles.title}>Terjadi Kendala Tampilan</Text>
            <Text style={styles.message}>
              {this.state.error?.message || 'Aplikasi mendeteksi ketidaksesuaian data sementara.'}
            </Text>
            <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Muat Ulang Halaman</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.skyBlueBackground,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textNavyDark,
    marginTop: 12,
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: Colors.textNavySecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.skyBlueHeader,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
