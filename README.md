# JSON Scrambler

**Randomly mutate a JSON object to change add, remove or change properties, for testing purposes. Always returns back valid JSON.**

## What is this about?

Have you ever wanted to easily test your code's ability to handle unexpected or incorrect JSON? Not _invalid_ JSON, but _incorrect_ JSON.

JSON Scrambler will take any arbitrary valid JSON and use predefined modifiers to make random and unexpected changes to the document structure, returning a modified document that still parses as valid JSON.

You can control how subtle, or not subtle, the changes are. From simple modifications like adding extra keys or values, shuffling array positions, or replacing values witn nulls, all the way up to returning a completely unrecognizable document from the input.

JSON Scrambler can be used for testing the robustness of any program, such as APIs or microservices, that accepts JSON input (such as an API or service) by providing infinite variations on existing JSON documents in ways that are unpredictable and random.

## Usage
