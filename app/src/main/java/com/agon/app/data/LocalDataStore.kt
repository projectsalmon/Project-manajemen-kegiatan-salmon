package com.agon.app.data

import android.content.Context
import com.agon.app.data.models.ActivityItem
import com.agon.app.data.models.AnnouncementItem
import com.agon.app.data.models.ContactItem
import com.agon.app.data.models.UserProfile
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File

class LocalDataStore(private val context: Context) {

    private val json = Json {
        ignoreUnknownKeys = true
        prettyPrint = true
        encodeDefaults = true
    }

    private val activitiesFile: File
        get() = File(context.filesDir, "activities_v2.json")

    private val announcementsFile: File
        get() = File(context.filesDir, "announcements_v2.json")

    private val profileFile: File
        get() = File(context.filesDir, "user_profile_v2.json")

    private val contactsFile: File
        get() = File(context.filesDir, "contacts_v2.json")

    fun loadActivities(): List<ActivityItem> {
        return try {
            if (activitiesFile.exists()) {
                val content = activitiesFile.readText()
                if (content.isNotBlank()) {
                    json.decodeFromString<List<ActivityItem>>(content)
                } else {
                    SampleData.sampleActivities
                }
            } else {
                saveActivities(SampleData.sampleActivities)
                SampleData.sampleActivities
            }
        } catch (e: Exception) {
            e.printStackTrace()
            SampleData.sampleActivities
        }
    }

    fun saveActivities(items: List<ActivityItem>) {
        try {
            val serialized = json.encodeToString(items)
            activitiesFile.writeText(serialized)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun loadAnnouncements(): List<AnnouncementItem> {
        return try {
            if (announcementsFile.exists()) {
                val content = announcementsFile.readText()
                if (content.isNotBlank()) {
                    json.decodeFromString<List<AnnouncementItem>>(content)
                } else {
                    SampleData.sampleAnnouncements
                }
            } else {
                saveAnnouncements(SampleData.sampleAnnouncements)
                SampleData.sampleAnnouncements
            }
        } catch (e: Exception) {
            e.printStackTrace()
            SampleData.sampleAnnouncements
        }
    }

    fun saveAnnouncements(items: List<AnnouncementItem>) {
        try {
            val serialized = json.encodeToString(items)
            announcementsFile.writeText(serialized)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun loadContacts(): List<ContactItem> {
        return try {
            if (contactsFile.exists()) {
                val content = contactsFile.readText()
                if (content.isNotBlank()) {
                    json.decodeFromString<List<ContactItem>>(content)
                } else {
                    SampleData.defaultContacts
                }
            } else {
                saveContacts(SampleData.defaultContacts)
                SampleData.defaultContacts
            }
        } catch (e: Exception) {
            e.printStackTrace()
            SampleData.defaultContacts
        }
    }

    fun saveContacts(items: List<ContactItem>) {
        try {
            val serialized = json.encodeToString(items)
            contactsFile.writeText(serialized)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun loadUserProfile(): UserProfile {
        return try {
            if (profileFile.exists()) {
                val content = profileFile.readText()
                if (content.isNotBlank()) {
                    json.decodeFromString<UserProfile>(content)
                } else {
                    SampleData.defaultUserProfile
                }
            } else {
                saveUserProfile(SampleData.defaultUserProfile)
                SampleData.defaultUserProfile
            }
        } catch (e: Exception) {
            e.printStackTrace()
            SampleData.defaultUserProfile
        }
    }

    fun saveUserProfile(profile: UserProfile) {
        try {
            val serialized = json.encodeToString(profile)
            profileFile.writeText(serialized)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
