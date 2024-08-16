from django.contrib import admin
from .models import ChatThread, ChatMessage


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 1  # Number of empty forms to display


class ChatThreadAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "title", "created_at", "updated_at")
    search_fields = ("user__username", "title")
    inlines = [ChatMessageInline]


class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("thread", "sender", "content", "created_at")
    list_filter = ("sender", "created_at")
    search_fields = ("content",)


admin.site.register(ChatThread, ChatThreadAdmin)
admin.site.register(ChatMessage, ChatMessageAdmin)
