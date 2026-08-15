package com.salmon.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.salmon.app.data.models.UserRole
import com.salmon.app.ui.components.CivicTopBar
import com.salmon.app.ui.components.RoleSwitchSheet
import com.salmon.app.ui.screens.*
import com.salmon.app.ui.theme.*
import com.salmon.app.viewmodel.AppViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            val appViewModel: AppViewModel = viewModel()
            
            AgonAppTheme {
                MainApp(appViewModel = appViewModel)
            }
        }
    }
}

@Composable
fun MainApp(appViewModel: AppViewModel) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    var showRoleSwitchSheet by remember { mutableStateOf(false) }
    var showAppConfigDialog by remember { mutableStateOf(false) }
    val snackbarHostState = remember { SnackbarHostState() }

    // Toast Snackbar listener
    LaunchedEffect(appViewModel.snackbarMessage) {
        appViewModel.snackbarMessage?.let { msg ->
            snackbarHostState.showSnackbar(msg)
            appViewModel.clearToast()
        }
    }

    // Auto navigate to dashboard when login succeeds
    LaunchedEffect(appViewModel.isLoggedIn) {
        if (appViewModel.isLoggedIn && (currentRoute == "login" || currentRoute == null)) {
            navController.navigate("beranda") {
                popUpTo("login") { inclusive = true }
            }
        }
    }

    val isLoginScreen = currentRoute == "login"
    val isFullscreenRoute = currentRoute == "login" ||
            currentRoute?.startsWith("activity_detail") == true ||
            currentRoute?.startsWith("create_activity") == true ||
            currentRoute == "admin_users"

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            if (!isLoginScreen && currentRoute?.startsWith("create_activity") == false && currentRoute?.startsWith("activity_detail") == false && currentRoute != "admin_users") {
                CivicTopBar(
                    currentRole = appViewModel.currentUser.role,
                    userName = appViewModel.currentUser.name,
                    userAvatarUrl = appViewModel.currentUser.avatarUrl,
                    appName = appViewModel.appName,
                    kelurahanName = appViewModel.kelurahanName,
                    rwScope = appViewModel.rwScope,
                    onAppConfigClick = if (appViewModel.currentUser.isAdmin || appViewModel.currentUser.role == UserRole.STAF_KELURAHAN) {
                        { showAppConfigDialog = true }
                    } else null,
                    onRoleClick = { showRoleSwitchSheet = true },
                    onProfileClick = { navController.navigate("profil") }
                )
            }
        },
        bottomBar = {
            if (!isFullscreenRoute) {
                CivicBottomNav(navController = navController, currentRoute = currentRoute)
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = if (appViewModel.isLoggedIn) "beranda" else "login",
            modifier = Modifier.padding(innerPadding)
        ) {
            // 1. Login Screen
            composable("login") {
                LoginScreen(
                    viewModel = appViewModel,
                    onLoginSuccess = { _ ->
                        navController.navigate("beranda") {
                            popUpTo("login") { inclusive = true }
                        }
                    }
                )
            }

            // 2. Beranda (Role-Tailored Dashboards: Warga, Posyandu, or Admin)
            composable("beranda") {
                when (appViewModel.currentUser.role) {
                    UserRole.WARGA -> {
                        WargaHomeScreen(
                            viewModel = appViewModel,
                            onNavigateToActivities = { navController.navigate("kegiatan") },
                            onNavigateToAnnouncements = { navController.navigate("pengumuman") },
                            onNavigateToCalendar = { navController.navigate("kalender") },
                            onActivityClick = { activity ->
                                navController.navigate("activity_detail/${activity.id}")
                            }
                        )
                    }
                    UserRole.POSYANDU -> {
                        PosyanduHomeScreen(
                            viewModel = appViewModel,
                            onCreatePosyanduActivityClick = { navController.navigate("create_activity") },
                            onActivityClick = { activity ->
                                navController.navigate("activity_detail/${activity.id}")
                            },
                            onNavigateToActivities = { navController.navigate("kegiatan") }
                        )
                    }
                    else -> {
                        AdminHomeScreen(
                            viewModel = appViewModel,
                            onCreateActivityClick = { navController.navigate("create_activity") },
                            onCreateAnnouncementClick = { navController.navigate("pengumuman") },
                            onActivityClick = { activity ->
                                navController.navigate("activity_detail/${activity.id}")
                            },
                            onNavigateToActivities = { navController.navigate("kegiatan") },
                            onNavigateToUserManagement = { navController.navigate("admin_users") }
                        )
                    }
                }
            }

            // 3. Kegiatan Screen (Activity List)
            composable("kegiatan") {
                ActivityListScreen(
                    viewModel = appViewModel,
                    onActivityClick = { activity ->
                        navController.navigate("activity_detail/${activity.id}")
                    },
                    onCreateActivityClick = { navController.navigate("create_activity") },
                    onEditActivityClick = { activity ->
                        navController.navigate("create_activity?editId=${activity.id}")
                    }
                )
            }

            // 4. Pengumuman Screen (Announcements)
            composable("pengumuman") {
                AnnouncementListScreen(
                    viewModel = appViewModel
                )
            }

            // 5. Kalender Screen
            composable("kalender") {
                CalendarScreen(
                    viewModel = appViewModel,
                    onActivityClick = { activity ->
                        navController.navigate("activity_detail/${activity.id}")
                    },
                    onCreateActivityClick = { navController.navigate("create_activity") }
                )
            }

            // 6. Profil Screen
            composable("profil") {
                ProfileScreen(
                    viewModel = appViewModel,
                    onActivityClick = { activityId ->
                        navController.navigate("activity_detail/$activityId")
                    },
                    onLogoutToLogin = {
                        appViewModel.signOut {
                            navController.navigate("login") {
                                popUpTo(0) { inclusive = true }
                            }
                        }
                    },
                    onNavigateToUserManagement = { navController.navigate("admin_users") }
                )
            }

            // 7. Activity Detail Screen
            composable(
                route = "activity_detail/{activityId}",
                arguments = listOf(navArgument("activityId") { type = NavType.StringType })
            ) { backStackEntry ->
                val activityId = backStackEntry.arguments?.getString("activityId") ?: ""
                ActivityDetailScreen(
                    activityId = activityId,
                    viewModel = appViewModel,
                    onBackClick = { navController.popBackStack() },
                    onEditClick = { id ->
                        navController.navigate("create_activity?editId=$id")
                    }
                )
            }

            // 8. Create / Edit Activity Form Screen
            composable(
                route = "create_activity?editId={editId}",
                arguments = listOf(navArgument("editId") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                })
            ) { backStackEntry ->
                val editId = backStackEntry.arguments?.getString("editId")
                CreateEditActivityScreen(
                    viewModel = appViewModel,
                    existingActivityId = editId,
                    onBackClick = { navController.popBackStack() }
                )
            }

            // 9. Admin User & Role Management Screen
            composable("admin_users") {
                AdminUserManagementScreen(
                    viewModel = appViewModel,
                    onBackClick = { navController.popBackStack() }
                )
            }
        }

        // Role Switching Sheet Dialog
        if (showRoleSwitchSheet) {
            RoleSwitchSheet(
                currentRole = appViewModel.currentUser.role,
                onRoleSelected = { role ->
                    appViewModel.switchRole(role)
                },
                onDismiss = { showRoleSwitchSheet = false }
            )
        }

        // App & Kelurahan Identity Config Dialog (Admin only)
        if (showAppConfigDialog) {
            com.salmon.app.ui.dialogs.AppConfigDialog(
                currentAppName = appViewModel.appName,
                currentKelurahan = appViewModel.kelurahanName,
                currentRwScope = appViewModel.rwScope,
                onSave = { newAppName, newKelurahan, newRw ->
                    appViewModel.updateAppConfig(newAppName, newKelurahan, newRw)
                },
                onDismiss = { showAppConfigDialog = false }
            )
        }
    }
}

@Composable
fun CivicBottomNav(navController: NavHostController, currentRoute: String?) {
    val items = listOf(
        BottomNavItem("beranda", "Beranda", Icons.Filled.Home, Icons.Outlined.Home),
        BottomNavItem("kegiatan", "Kegiatan", Icons.Filled.Event, Icons.Outlined.Event),
        BottomNavItem("pengumuman", "Pengumuman", Icons.Filled.Campaign, Icons.Outlined.Campaign),
        BottomNavItem("kalender", "Kalender", Icons.Filled.CalendarMonth, Icons.Outlined.CalendarMonth),
        BottomNavItem("profil", "Profil", Icons.Filled.Person, Icons.Outlined.Person)
    )

    NavigationBar(
        tonalElevation = 8.dp,
        containerColor = Color.White
    ) {
        items.forEach { item ->
            val isSelected = currentRoute == item.route

            NavigationBarItem(
                icon = {
                    Icon(
                        imageVector = if (isSelected) item.selectedIcon else item.unselectedIcon,
                        contentDescription = item.label
                    )
                },
                label = {
                    Text(
                        text = item.label,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                        )
                    )
                },
                selected = isSelected,
                onClick = {
                    if (currentRoute != item.route) {
                        navController.navigate(item.route) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = OnYellowContainer,
                    selectedTextColor = OnYellowContainer,
                    indicatorColor = YellowContainer,
                    unselectedIconColor = TextNavyMuted,
                    unselectedTextColor = TextNavyMuted
                )
            )
        }
    }
}

data class BottomNavItem(
    val route: String,
    val label: String,
    val selectedIcon: androidx.compose.ui.graphics.vector.ImageVector,
    val unselectedIcon: androidx.compose.ui.graphics.vector.ImageVector
)
