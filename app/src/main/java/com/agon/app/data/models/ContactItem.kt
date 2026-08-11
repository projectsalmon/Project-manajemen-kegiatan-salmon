package com.agon.app.data.models

import kotlinx.serialization.Serializable

@Serializable
data class ContactItem(
    val id: String,
    val nameTitle: String,
    val phoneNumber: String,
    val category: String // e.g. "Kantor Kelurahan Sukamaju", "Pengurus RT / RW", "Kader Posyandu"
)
