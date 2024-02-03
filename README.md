# JSON Scrambler

This small library mutates the structure of a JSON object while remaining valid JSON.

This can be useful for testing the robustness of a program that accepts JSON input (such as an API) by mutating a JSON document in ways that are unpredictable and random, while still returning valid JSON.
