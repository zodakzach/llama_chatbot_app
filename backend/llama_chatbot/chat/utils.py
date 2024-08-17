def truncate_context(context_str):
    """
    Truncate a given string to 5000 characters if it exceeds the limit.
    If the string is too long, split it by newline characters and remove
    older messages until the total length is within the limit.

    Args:
        context_str (str): The input string to be truncated.

    Returns:
        str: The truncated string within the 5000 character limit.
    """
    max_length = 5000

    # Check if the context exceeds the maximum length
    while len(context_str) > max_length:
        lines = context_str.split('\n')
        # Remove the first message (oldest)
        lines = lines[1:]
        # Rebuild the context
        context_str = '\n'.join(lines)

    return context_str