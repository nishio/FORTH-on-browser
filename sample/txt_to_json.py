import json
OUTPUT = "sample.json"
samples = []
samples.append(
    dict(
        name="default",
        code=file("default.txt").read()))


json.dump(samples, file(OUTPUT, "w"))
