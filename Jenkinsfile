

pipeline {
    agent any

    triggers {
        pollSCM('H/5 * * * *')
    }

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/FattahAhmadSabri/routine_fitness.git'
            }
        }

        stage('Deploy Backend') {
            steps {
                sh '''
                    sudo -u ubuntu /usr/local/bin/deploy-routine.sh
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    for i in {1..10}; do
                        if curl -fsS http://127.0.0.1:5000/check; then
                            echo "Backend health check passed"
                            exit 0
                        fi
                        sleep 3
                    done

                    echo "Backend health check failed"
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            echo 'Routine Fitness deployment successful!'
        }
        failure {
            echo 'Deployment failed. Check console output.'
        }
    }
}

