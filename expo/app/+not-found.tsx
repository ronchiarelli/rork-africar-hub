// template
import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn&apos;t exist.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: Colors.gray[50],
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.gray[900],
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
    paddingHorizontal: 24,
    backgroundColor: Colors.orange.primary,
    borderRadius: 14,
  },
  linkText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: "700" as const,
  },
});
