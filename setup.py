from setuptools import find_packages, setup

with open("requirements.txt") as f:
    install_requires = f.read().strip().split("\n")

with open("README.md") as f:
    long_description = f.read()

setup(
    name="studio",
    version="0.0.1",
    description="NCE Studio",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="NCE Studio",
    author_email="developer@example.com",
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=install_requires,
    python_requires=">=3.10",
)
