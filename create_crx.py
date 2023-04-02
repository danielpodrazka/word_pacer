import os
import subprocess
import shutil
import zipfile
import pathlib

# Path to your Chrome browser executable
chrome_path = "/usr/bin/google-chrome"
# Path to your Word Pacer extension folder containing manifest.json
REPO_PATH = pathlib.Path(__file__).parents[0]
SOURCE_DIR = os.path.join(REPO_PATH, "src")


# Create a temporary zip file of the extension
def create_zip(zip_file_path):
    with zipfile.ZipFile(zip_file_path, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for root, _, files in os.walk(SOURCE_DIR):
            for file in files:
                src_path = os.path.join(root, file)
                relative_path = os.path.relpath(src_path, SOURCE_DIR)
                zip_file.write(src_path, relative_path)


# Package the extension zip file into a crx file
def create_crx(crx_path, chrome_path):
    rel_src_dir = pathlib.Path(SOURCE_DIR).parts[-1]
    packaging_cmd = [
        chrome_path,
        "--pack-extension=" + SOURCE_DIR,
        "--pack-extension-key=" + os.path.join(REPO_PATH, "word_pacer.pem"),
    ]
    subprocess.check_output(packaging_cmd)
    shutil.move(os.path.join(REPO_PATH, f"{rel_src_dir}.crx"), crx_path)


def main():
    word_pacer_zip = os.path.join("word_pacer.zip")
    if os.path.exists(word_pacer_zip):
        os.remove(word_pacer_zip)
    word_pacer_crx = os.path.join(REPO_PATH, "word_pacer.crx")
    # Create a zip file of the extension
    create_zip(word_pacer_zip)
    # Create a crx file from the extension folder
    create_crx(word_pacer_crx, chrome_path)
    # Clean up the temporary zip file
    os.remove(word_pacer_zip)


if __name__ == "__main__":
    main()
