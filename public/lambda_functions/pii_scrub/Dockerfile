FROM public.ecr.aws/lambda/python:3.9

# Update and install necessary tools
RUN yum update -y && yum install -y wget && yum clean all

# Download the appropriate Miniconda installer based on the architecture
# Use uname -m to dynamically determine architecture
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then \
        wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O miniconda.sh; \
    elif [ "$ARCH" = "aarch64" ]; then \
        wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-aarch64.sh -O miniconda.sh; \
    else \
        echo "Unsupported architecture: $ARCH" && exit 1; \
    fi && \
    sh miniconda.sh -b -p /opt/miniconda && \
    rm miniconda.sh

# Copy the Conda environment YAML file
COPY aws-assignment.yml /tmp/environment.yml

# Create the Conda environment
RUN /opt/miniconda/bin/conda env create --file /tmp/environment.yml --prefix /opt/conda-env

# Install AWS Lambda Runtime Interface Client (RIC)
RUN /opt/conda-env/bin/pip install awslambdaric

# Install the SpaCy model en_core_web_sm
RUN /opt/conda-env/bin/python -m spacy download en_core_web_sm

# Install the boto3 package
RUN /opt/conda-env/bin/pip install boto3

# Replace the image’s Python binary with the one from the Conda environment
RUN mv /var/lang/bin/python3.9 /var/lang/bin/python3.9-clean && \
    ln -sf /opt/conda-env/bin/python /var/lang/bin/python3.9

# Add your Python code
COPY my_lambda_file.py /opt/my-code/my_lambda_file.py

# Set the Python path to include your code
ENV PYTHONPATH="/var/lang/lib/python3.9/site-packages:/opt/my-code"

# Set the Lambda function handler as the CMD
CMD ["my_lambda_file.lambda_handler"]
