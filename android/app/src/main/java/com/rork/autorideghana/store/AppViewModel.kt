package com.rork.autorideghana.store

import androidx.lifecycle.ViewModel
import com.rork.autorideghana.data.MockData
import com.rork.autorideghana.data.UserProfile
import com.rork.autorideghana.data.UserRole
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class AppState(
    val isLoggedIn: Boolean = false,
    val role: UserRole = UserRole.CUSTOMER,
    val favoriteIds: Set<String> = emptySet(),
)

class AppViewModel : ViewModel() {
    private val _state = MutableStateFlow(AppState())
    val state: StateFlow<AppState> = _state.asStateFlow()

    val currentUser: UserProfile
        get() = MockData.profileForRole(_state.value.role)

    fun login() {
        _state.value = _state.value.copy(isLoggedIn = true)
    }

    fun logout() {
        _state.value = _state.value.copy(isLoggedIn = false)
    }

    fun switchRole(role: UserRole) {
        _state.value = _state.value.copy(role = role)
    }

    fun toggleFavorite(carId: String) {
        val current = _state.value.favoriteIds
        _state.value = _state.value.copy(
            favoriteIds = if (current.contains(carId)) current - carId else current + carId
        )
    }

    fun isFavorite(carId: String): Boolean = _state.value.favoriteIds.contains(carId)
}
